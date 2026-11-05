// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {history, redo, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    EditorState,
    TextSelection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {BaseSchemaSpecs} from '@gravity-ui/markdown-editor/specs';
import type {HeaderDimensions} from '@gravity-ui/markdown-plugin-header';
import {afterEach, describe, expect, it} from 'vitest';

import {headerSettingsKey, headerSettingsPlugin, openHeaderSettings} from './Settings';
import {copyHeader, insertHeader, removeHeader, setHeaderDimensions} from './commands';
import {HeaderSpecs} from './specs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(HeaderSpecs),
}).buildDeps();

let view: EditorView | undefined;
afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(markup = ':::header\n:::') {
    const doc = markupParser.parse(markup);
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({schema, doc, plugins: [history()]}),
    });
    return view;
}

function run(editor: EditorView, command: Command) {
    return command(editor.state, editor.dispatch);
}

function dimensions(editor: EditorView) {
    const {height, width} = editor.state.doc.firstChild?.attrs ?? {};
    return {height, width};
}

describe('Header extension', () => {
    it.each<HeaderDimensions>([
        {height: 's', width: 'm'},
        {height: 'm', width: 's'},
        {height: 'l', width: 'full'},
    ])('should round trip %j', ({height, width}) => {
        const source = `:::header{height="${height}" width="${width}"}\n:::`;
        const doc = markupParser.parse(source);
        expect(doc.firstChild?.attrs).toEqual({height, width, source: null});
        expect(serializer.serialize(doc)).toBe(source);
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(DOMParser.fromSchema(schema).parse(container).toJSON()).toEqual(doc.toJSON());
    });

    it('should use the same defaults in the schema and parser', () => {
        const defaults = {height: 's', width: 'm', source: null};
        expect(schema.nodes.header.create().attrs).toEqual(defaults);
        expect(markupParser.parse(':::header\n:::').firstChild?.attrs).toEqual(defaults);
    });

    it('should skip an unsupported attribute and use the default for an unsupported value', () => {
        expect(
            serializer.serialize(markupParser.parse(':::header{height="xl" color="red"}\n:::')),
        ).toBe(':::header{height="s" width="m"}\n:::');
    });

    it.each([
        ':::header\nText **with formatting**\n:::',
        ':::header[Title]\n:::',
        ':::header\nText!\n[link](url)\n\n:::',
    ])('should keep the text of %j unchanged', (markup) => {
        const doc = markupParser.parse(markup);
        expect(doc.firstChild?.attrs.source).toBe(markup);
        expect(serializer.serialize(doc)).toBe(markup);
    });

    it('should keep the size of a block with text', () => {
        const editor = createView(':::header\nText\n:::');
        expect(run(editor, setHeaderDimensions(0, {height: 'l'}))).toBe(false);
        expect(serializer.serialize(editor.state.doc)).toBe(':::header\nText\n:::');
    });

    it('should copy and remove a header', () => {
        const editor = createView(':::header{height="m" width="s"}\n:::');
        expect(run(editor, copyHeader(0))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(
            ':::header{height="m" width="s"}\n:::\n\n:::header{height="m" width="s"}\n:::',
        );
        expect(run(editor, removeHeader(0))).toBe(true);
        expect(serializer.serialize(editor.state.doc)).toBe(':::header{height="m" width="s"}\n:::');
        expect(run(editor, removeHeader(1))).toBe(false);
    });

    it('should update dimensions independently and undo each change', () => {
        const editor = createView();
        expect(run(editor, setHeaderDimensions(0, {height: 'l'}))).toBe(true);
        expect(run(editor, setHeaderDimensions(0, {width: 'full'}))).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'full'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'm'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 's', width: 'm'});
        expect(redo(editor.state, editor.dispatch)).toBe(true);
        expect(dimensions(editor)).toEqual({height: 'l', width: 'm'});
    });

    it('should insert an empty header and undo the insertion', () => {
        const editor = createView('');
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1)));
        expect(run(editor, insertHeader)).toBe(true);
        expect(editor.state.doc.firstChild?.type.name).toBe('header');
        expect(dimensions(editor)).toEqual({height: 's', width: 'm'});
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(editor.state.doc.firstChild?.type.name).toBe('paragraph');
    });

    it('should track the open settings and close them when the header is removed', () => {
        let state = EditorState.create({
            schema,
            doc: markupParser.parse('Before\n\n:::header\n:::'),
            plugins: [headerSettingsPlugin()],
        });
        const dispatch = (tr: Transaction) => {
            state = state.apply(tr);
        };
        const pos = state.doc.child(0).nodeSize;
        openHeaderSettings(pos)(state, dispatch);
        expect(headerSettingsKey.getState(state)).toBe(pos);
        dispatch(state.tr.insertText('New ', 1));
        expect(headerSettingsKey.getState(state)).toBe(pos + 4);
        removeHeader(pos + 4)(state, dispatch);
        expect(headerSettingsKey.getState(state)).toBeNull();
    });
});
