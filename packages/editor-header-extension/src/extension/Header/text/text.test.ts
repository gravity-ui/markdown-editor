// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {history, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    EditorState,
    NodeSelection,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseSchemaSpecs,
    BlockquoteSpecs,
    BoldSpecs,
    ListsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {afterEach, describe, expect, it} from 'vitest';

import {HeaderSpecs} from '../HeaderSpecs';
import {insertHeader} from '../commands';

import {
    findHeaderSlot,
    headerTitleKeymap,
    setHeaderTextVisibility,
    setHeaderTitleAttrs,
} from './commands';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BoldSpecs)
            .use(BlockquoteSpecs)
            .use(ListsSpecs)
            .use(HeaderSpecs),
}).buildDeps();

const full = [
    ':::header{height="m" width="m"}',
    '',
    ':::header-title{size="1" color="red"}',
    'Team **portal**',
    ':::',
    '',
    ':::header-content',
    'First paragraph',
    '',
    'Second paragraph',
    ':::',
    '',
    ':::',
].join('\n');

let view: EditorView | undefined;

afterEach(() => {
    view?.destroy();
    view = undefined;
});

function createView(markup: string, editable = true) {
    const doc = markupParser.parse(markup);
    view = new EditorView(document.createElement('div'), {
        state: EditorState.create({schema, doc, plugins: [history()]}),
        editable: () => editable,
    });
    return view;
}

function select(editor: EditorView, pos: number) {
    editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos)));
}

function run(editor: EditorView, command: Command) {
    return command(editor.state, editor.dispatch, editor);
}

function findHeaderNode(doc: Node) {
    let header: Node | undefined;
    doc.descendants((node) => {
        header ??= node.type.name === 'header' ? node : undefined;
        return !header;
    });
    return header?.toJSON();
}

const titleSize = (editor: EditorView) => editor.state.doc.firstChild?.firstChild?.nodeSize ?? 0;

const markup = (editor: EditorView) => serializer.serialize(editor.state.doc);

describe('Header text', () => {
    it.each([
        [full, full],
        [
            ':::header\n:::header-content\nOnly description\n:::\n:::',
            ':::header{height="s" width="m"}\n\n:::header-content\nOnly description\n:::\n\n:::',
        ],
        [
            ':::header{title="false"}\n:::header-title{size="3"}\n:::\n:::',
            ':::header{height="s" width="m" title="false"}\n\n:::header-title{size="3"}\n:::\n\n:::',
        ],
        [
            ':::header{title="false"}\n:::header-title\n:::\n:::',
            ':::header{height="s" width="m" title="false"}\n\n:::header-title\n:::\n\n:::',
        ],
        [
            ':::header\n:::header-title\n:::\n:::header-content\n:::\n:::',
            ':::header{height="s" width="m"}\n\n:::',
        ],
        [
            '> :::header\n> :::header-title\n> Quoted\n> :::\n> :::',
            '> :::header{height="s" width="m"}\n>\n> :::header-title\n> Quoted\n> :::\n>\n> :::',
        ],
        [
            '- :::header{description="false"}\n  :::header-content\n  Kept\n  :::\n  :::\n- Next',
            '- :::header{height="s" width="m" description="false"}\n\n  :::header-content\n  Kept\n  :::\n\n  :::\n\n- Next',
        ],
        [
            ':::header\n:::header-title\nTitle\n:::\nText\n\n:::header-content\nDescription\n:::\n:::',
            ':::header{height="s" width="m"}\n\n:::header-title\nTitle\n:::\n\nText\n\n:::header-content\nDescription\n:::\n\n:::',
        ],
    ])('should round trip text slots in %j', (source, serialized) => {
        const doc = markupParser.parse(source);
        expect(serializer.serialize(doc)).toBe(serialized);
        expect(serializer.serialize(markupParser.parse(serialized))).toBe(serialized);

        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        const parsed = DOMParser.fromSchema(schema).parse(container);
        expect(findHeaderNode(parsed)).toEqual(findHeaderNode(doc));
    });

    it('should parse preview HTML with whitespace between slots', () => {
        const container = document.createElement('div');
        container.innerHTML = [
            '<div class="g-md-header-plugin g-md-header-plugin_height_m g-md-header-plugin_width_m">',
            '<div class="g-md-header-plugin__title g-md-header-plugin__title_size_1 g-md-header-plugin__title_color_red">',
            '<p>Team</p>',
            '</div>',
            '<div class="g-md-header-plugin__content g-md-header-plugin__content_hidden">',
            '<p>Desc</p>',
            '</div>',
            '</div>',
        ].join('\n');
        const parsed = DOMParser.fromSchema(schema).parse(container);
        expect(serializer.serialize(parsed)).toBe(
            [
                ':::header{height="m" width="m" description="false"}',
                '',
                ':::header-title{size="1" color="red"}',
                'Team',
                ':::',
                '',
                ':::header-content',
                'Desc',
                ':::',
                '',
                ':::',
            ].join('\n'),
        );
    });

    it('should parse title and description as separate nodes', () => {
        const header = markupParser.parse(full).firstChild;
        expect(header?.child(0).type.name).toBe('header_title');
        expect(header?.child(0).attrs).toEqual({size: '1', color: 'red', hidden: false});
        expect(header?.child(0).textContent).toBe('Team portal');
        expect(header?.child(1).type.name).toBe('header_content');
        expect(header?.child(1).attrs).toEqual({hidden: false});
        expect(header?.child(1).childCount).toBe(2);
    });

    it.each([
        ':::header\n:::header-title\nA\n:::\n:::header-title\nB\n:::\n:::',
        ':::header\n:::header-content\nA\n:::\n:::header-title\nB\n:::\n:::',
    ])('should keep a misplaced slot as text in %j', (source) => {
        const header = markupParser.parse(source).firstChild;
        expect(header?.type.name).toBe('header');
        expect(header?.textContent).toContain('A');
        expect(header?.textContent).toContain(':::header-title');
    });

    it.each([
        ':::header{title="yes"}\n:::header-title\nA\n:::\n:::',
        ':::header\n:::header-title{size="0" align="left"}\nA\n:::\n:::',
    ])('should use defaults for unsupported text attributes in %j', (source) => {
        expect(serializer.serialize(markupParser.parse(source))).toBe(
            ':::header{height="s" width="m"}\n\n:::header-title\nA\n:::\n\n:::',
        );
    });

    it('should type text into the slots of an inserted header', () => {
        const editor = createView('');
        select(editor, 1);
        expect(run(editor, insertHeader)).toBe(true);
        editor.dispatch(editor.state.tr.insertText('Title'));
        const contentStart = titleSize(editor) + 3;
        editor.dispatch(editor.state.tr.insertText('Description', contentStart));
        expect(markup(editor)).toBe(
            ':::header{height="s" width="m"}\n\n:::header-title\nTitle\n:::\n\n:::header-content\nDescription\n:::\n\n:::',
        );
    });

    it('should keep long text', () => {
        const text = 'Long text '.repeat(200).trim();
        const source = `:::header{height="s" width="m"}\n\n:::header-title\n${text}\n:::\n\n:::header-content\n${text}\n:::\n\n:::`;
        expect(serializer.serialize(markupParser.parse(source))).toBe(source);
    });

    it('should hide and show slots without losing content and undo each change', () => {
        const editor = createView(full);
        expect(run(editor, setHeaderTextVisibility(0, 'title', false))).toBe(true);
        expect(run(editor, setHeaderTextVisibility(0, 'description', false))).toBe(true);
        expect(markup(editor)).toBe(
            full.replace(
                '{height="m" width="m"}',
                '{height="m" width="m" title="false" description="false"}',
            ),
        );
        expect(
            editor.dom.querySelector('.g-md-header-plugin__title_hidden')?.textContent,
        ).toBe('Team portal');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(
            full.replace('{height="m" width="m"}', '{height="m" width="m" title="false"}'),
        );
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(full);
    });

    it('should change title size and color and undo each change', () => {
        const editor = createView(full);
        expect(run(editor, setHeaderTitleAttrs(0, {size: '4'}))).toBe(true);
        expect(run(editor, setHeaderTitleAttrs(0, {color: 'auto'}))).toBe(true);
        expect(markup(editor)).toContain(':::header-title{size="4"}\n');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toContain(':::header-title{size="4" color="red"}\n');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(full);
    });

    it('should reject a position without a header', () => {
        const editor = createView(`${full}\n\nAfter`);
        const after = editor.state.doc.child(0).nodeSize;
        expect(run(editor, setHeaderTitleAttrs(after, {size: '3'}))).toBe(false);
        expect(run(editor, setHeaderTextVisibility(after, 'title', false))).toBe(false);
        expect(findHeaderSlot(editor.state, after, 'description')).toBeUndefined();
    });

    it('should change the title size with Mod-Alt-1 to Mod-Alt-6 only inside the title', () => {
        const keymap = headerTitleKeymap();
        const editor = createView(full);
        select(editor, 3);
        for (const size of ['1', '2', '3', '4', '5', '6']) {
            expect(keymap[`Mod-Alt-${size}`](editor.state, editor.dispatch, editor)).toBe(true);
            expect(editor.state.doc.firstChild?.firstChild?.attrs.size).toBe(size);
        }
        select(editor, titleSize(editor) + 3);
        expect(keymap['Mod-Alt-1'](editor.state, editor.dispatch, editor)).toBe(false);

        editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)));
        expect(keymap['Mod-Alt-3'](editor.state, editor.dispatch, editor)).toBe(true);
        expect(editor.state.doc.firstChild?.firstChild?.attrs.size).toBe('3');

        const readonly = createView(full, false);
        select(readonly, 3);
        expect(keymap['Mod-Alt-3'](readonly.state, readonly.dispatch, readonly)).toBe(false);
    });
});
