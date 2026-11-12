// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {history, redo, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {EditorState, NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    BaseSchemaSpecs,
    BlockquoteSpecs,
    LinkSpecs,
    ListsSpecs,
} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {HeaderSpecs} from '../Header/HeaderSpecs';
import {copyHeader, setHeaderDimension} from '../Header/commands';

import {Button} from './Button';
import {ButtonSpecs} from './ButtonSpecs';

const {schema, markupParser, serializer} = new ExtensionsManager({
    extensions: (builder) =>
        builder
            .use(BaseSchemaSpecs, {})
            .use(BlockquoteSpecs)
            .use(ListsSpecs)
            .use(LinkSpecs)
            .use(HeaderSpecs)
            .use(ButtonSpecs),
}).buildDeps();
const button =
    ':::button{href="/page?a=1&b=2" view="outline" color="brand" target="_blank"}\nRead more\n:::';
describe('Button extension', () => {
    it('should preserve buttons when resizing, undoing, and copying a header', () => {
        const original = markupParser.parse(`:::header\n${button}\n:::`);
        let state = EditorState.create({schema, doc: original, plugins: [history()]});
        const dispatch = (transaction: Parameters<typeof state.apply>[0]) => {
            state = state.apply(transaction);
        };
        const originalButton = original.child(0).child(0);
        expect(setHeaderDimension(0, 'height', 'l')(state, dispatch)).toBe(true);
        expect(setHeaderDimension(0, 'width', 'full')(state, dispatch)).toBe(true);
        expect(state.doc.child(0).child(0).eq(originalButton)).toBe(true);
        expect(undo(state, dispatch)).toBe(true);
        expect(undo(state, dispatch)).toBe(true);
        expect(state.doc.eq(original)).toBe(true);
        expect(redo(state, dispatch)).toBe(true);
        expect(redo(state, dispatch)).toBe(true);
        expect(copyHeader(0)(state, dispatch)).toBe(true);
        expect(state.doc.child(0).eq(state.doc.child(1))).toBe(true);
        expect(markupParser.parse(serializer.serialize(state.doc)).eq(state.doc)).toBe(true);
    });
    it.each([
        [':::button\nLabel\n:::', ':::button\nLabel\n:::'],
        [
            ':::button{view="action" color="standard" target="_self" href=""}\nLabel\n:::',
            ':::button\nLabel\n:::',
        ],
        [
            ':::button{view="normal" color="gray"}\nLabel\n:::',
            ':::button{view="normal"}\nLabel\n:::',
        ],
        [
            ':::button{view="outline" color="brand" target="_blank" href="/page"}\nLabel\n:::',
            ':::button{href="/page" view="outline" color="brand" target="_blank"}\nLabel\n:::',
        ],
    ])('should omit defaults when saving %j', (source, expected) => {
        expect(serializer.serialize(markupParser.parse(source))).toBe(expected);
    });
    it.each([
        button,
        ':::button\n  **Bold** and [link](/page)\n\nSecond paragraph\n:::',
        `:::header\n${button}\n:::`,
        [button, button].join('\n\n'),
        `:::header\n${[button, button].join('\n\n')}\n:::`,
        '> :::button\n> Label\n> :::',
        '> :::button\n> Label\n>\n> :::',
        '- :::button\n  Label\n  :::',
    ])('should preserve button content across mode switches in %j', (source) => {
        const doc = markupParser.parse(source);
        const serialized = serializer.serialize(doc);
        expect(markupParser.parse(serialized).toJSON()).toEqual(doc.toJSON());
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        const buttons = (root: Node) => {
            const result: unknown[] = [];
            root.descendants((node) => {
                if (node.type.name === 'button') result.push(node.toJSON());
            });
            return result;
        };
        expect(buttons(DOMParser.fromSchema(schema).parse(container))).toEqual(buttons(doc));
    });
    it.each([
        [':::button\n:::', ':::button\nButton\n:::'],
        [':::button\n\n:::', ':::button\nButton\n:::'],
        [':::button\n   \n:::', ':::button\nButton\n:::'],
        ['> :::button\n> :::', '> :::button\n> Button\n> :::'],
        [':::button{view="flat"}\n:::', ':::button{view="flat"}\nButton\n:::'],
    ])('should save the placeholder as the label of an empty button in %j', (source, expected) => {
        const doc = markupParser.parse(source);
        expect(serializer.serialize(doc)).toBe(expected);
    });
    it('should show the placeholder in an empty button without changing its content', () => {
        const deps = new ExtensionsManager({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Button),
        }).build();
        const doc = deps.markupParser.parse(':::button\n\n:::');
        const view = new EditorView(document.createElement('div'), {
            state: EditorState.create({doc, schema: deps.schema}),
            nodeViews: deps.nodeViews,
        });
        try {
            expect((view.nodeDOM(0) as HTMLElement).textContent).toBe('Button');
            expect(doc.firstChild?.attrs.content).toBe('\n');
            const container = document.createElement('div');
            container.append(DOMSerializer.fromSchema(deps.schema).serializeFragment(doc.content));
            expect(container.textContent?.trim()).toBe('');
        } finally {
            view.destroy();
        }
    });
    it('should preserve the complete unsupported body', () => {
        const body = '**Bold**\n\nSecond paragraph\n<script>text</script>\n';
        const doc = markupParser.parse(`:::button\n${body}:::`);
        expect(doc.firstChild?.attrs.content).toBe(body);
        expect(serializer.serialize(doc)).toContain(body);
    });
    it('should render a selectable atom without editable content or navigation', () => {
        const deps = new ExtensionsManager({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Button),
        }).build();
        const doc = deps.markupParser.parse(button);
        const view = new EditorView(document.createElement('div'), {
            state: EditorState.create({doc, schema: deps.schema}),
            nodeViews: deps.nodeViews,
        });
        try {
            const dom = view.nodeDOM(0) as HTMLElement;
            expect(doc.firstChild?.isAtom).toBe(true);
            expect(dom.contentEditable).toBe('false');
            expect(dom.textContent).toBe('Read more\n');
            expect(dom.dispatchEvent(new MouseEvent('click', {cancelable: true}))).toBe(false);
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, 0)));
            expect((view.state.selection as NodeSelection).node.type.name).toBe('button');
            view.dispatch(view.state.tr.deleteSelection());
            expect(view.state.doc.firstChild?.type.name).toBe('paragraph');
        } finally {
            view.destroy();
        }
    });
});
