// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
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
    ':::button{href="/page?a=1&b=2" view="outline" color="blue" target="_blank"}\nRead more\n:::';
describe('Button extension', () => {
    it.each([
        button,
        ':::button\n:::',
        ':::button\n  **Bold** and [link](/page)\n\nSecond paragraph\n:::',
        `:::header\n${button}\n:::`,
        [button, button].join('\n\n'),
        `:::header\n${[button, button].join('\n\n')}\n:::`,
        '> :::button\n> Label\n> :::',
        '> :::button\n> :::',
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
            expect(dom.textContent).toBe('Read more');
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
