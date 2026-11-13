// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {history, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
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
import {ButtonSpecs, buttonNodeType} from './ButtonSpecs';
import {insertButton, setButtonAttrs} from './commands';

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
    ':button[Read more]{href="/page?a=1&b=2" view="outline" color="info" target="_blank"}';

const buttons = (root: Node) => {
    const result: unknown[] = [];
    root.descendants((node) => {
        if (node.type.name === 'button') result.push(node.toJSON());
    });
    return result;
};

function createState(markup: string) {
    let state = EditorState.create({schema, doc: markupParser.parse(markup), plugins: [history()]});
    const dispatch = (transaction: Parameters<typeof state.apply>[0]) => {
        state = state.apply(transaction);
    };
    return {state: () => state, dispatch};
}

describe('Button extension', () => {
    it('should parse a button as an inline node with its label as text', () => {
        const paragraph = markupParser.parse(`Press ${button} now`).child(0);
        expect(paragraph.childCount).toBe(3);
        expect(paragraph.child(1).type.name).toBe('button');
        expect(paragraph.child(1).textContent).toBe('Read more');
        expect(paragraph.child(1).attrs).toEqual({
            href: '/page?a=1&b=2',
            view: 'outline',
            color: 'info',
            target: '_blank',
        });
    });
    it.each([
        [':button[Label]', ':button[Label]{view="action" color="standard"}'],
        [
            ':button[Label]{view="action" color="standard" target="_self" href=""}',
            ':button[Label]{view="action" color="standard"}',
        ],
        [':button[Label]{view="normal"}', ':button[Label]{view="normal" color="gray"}'],
        [
            ':button[Label]{target="_blank" color="info" view="outline" href="/page"}',
            ':button[Label]{href="/page" view="outline" color="info" target="_blank"}',
        ],
        [
            ':button[Label]{target="_top"}',
            ':button[Label]{view="action" color="standard" target="_top"}',
        ],
        [':button[\\[x\\] a\\\\b]', ':button[\\[x\\] a\\\\b]{view="action" color="standard"}'],
        [':button[**Bold**]', ':button[**Bold**]{view="action" color="standard"}'],
    ])('should save %j as %j', (source, expected) => {
        expect(serializer.serialize(markupParser.parse(source))).toBe(expected);
    });
    it.each([
        button,
        `Press ${button} and read`,
        `${button} ${button}`,
        `:::header\n${button} ${button}\n:::`,
        `> ${button}`,
        `- ${button}`,
        `Text ${button} [link](/page)`,
    ])('should preserve buttons across mode switches in %j', (source) => {
        const doc = markupParser.parse(source);
        const serialized = serializer.serialize(doc);
        expect(markupParser.parse(serialized).toJSON()).toEqual(doc.toJSON());
        const container = document.createElement('div');
        container.append(DOMSerializer.fromSchema(schema).serializeFragment(doc.content));
        expect(buttons(DOMParser.fromSchema(schema).parse(container))).toEqual(buttons(doc));
    });
    it('should save the placeholder as the label of an empty button', () => {
        const doc = schema.node('doc', null, [
            schema.node('paragraph', null, [buttonNodeType(schema).create({view: 'flat'})]),
        ]);
        expect(serializer.serialize(doc)).toBe(':button[Button]{view="flat" color="standard"}');
    });
    it('should preserve buttons when resizing, undoing, and copying a header', () => {
        const {state, dispatch} = createState(`:::header\n${button}\n:::`);
        const original = state().doc;
        expect(setHeaderDimension(0, 'height', 'l')(state(), dispatch)).toBe(true);
        expect(undo(state(), dispatch)).toBe(true);
        expect(state().doc.eq(original)).toBe(true);
        expect(copyHeader(0)(state(), dispatch)).toBe(true);
        expect(state().doc.child(0).eq(state().doc.child(1))).toBe(true);
        expect(markupParser.parse(serializer.serialize(state().doc)).eq(state().doc)).toBe(true);
    });
    it('should insert a default button and put the cursor after it', () => {
        const {state, dispatch} = createState('Before after');
        dispatch(state().tr.setSelection(TextSelection.create(state().doc, 7)));
        expect(insertButton(state(), dispatch)).toBe(true);
        expect(serializer.serialize(state().doc)).toBe(
            'Before:button[Button]{view="action" color="standard"} after',
        );
        expect(state().selection.$from.nodeBefore?.type.name).toBe('button');
    });
    it('should not insert a button into a button', () => {
        const {state, dispatch} = createState(button);
        dispatch(state().tr.setSelection(TextSelection.create(state().doc, 3)));
        expect(insertButton(state(), dispatch)).toBe(false);
    });
    it('should change attributes in separate undo steps and keep the label', () => {
        const {state, dispatch} = createState(button);
        const original = state().doc;
        expect(setButtonAttrs(1, {view: 'normal', color: 'green'})(state(), dispatch)).toBe(true);
        expect(setButtonAttrs(1, {target: '_self', href: ''})(state(), dispatch)).toBe(true);
        expect(serializer.serialize(state().doc)).toBe(
            ':button[Read more]{view="normal" color="green"}',
        );
        expect(undo(state(), dispatch)).toBe(true);
        expect(state().doc.child(0).child(0).attrs.view).toBe('normal');
        expect(undo(state(), dispatch)).toBe(true);
        expect(state().doc.eq(original)).toBe(true);
        expect(setButtonAttrs(0, {view: 'flat'})(state(), dispatch)).toBe(false);
    });
    it('should render an editable label without navigation', () => {
        const deps = new ExtensionsManager({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Button),
        }).build();
        const doc = deps.markupParser.parse(button);
        const view = new EditorView(document.createElement('div'), {
            state: EditorState.create({doc, schema: deps.schema}),
            nodeViews: deps.nodeViews,
        });
        try {
            const dom = view.nodeDOM(1) as HTMLElement;
            expect(dom.tagName).toBe('A');
            expect(dom.getAttribute('href')).toBe('/page?a=1&b=2');
            expect(dom.contentEditable).not.toBe('false');
            expect(dom.textContent).toBe('Read more');
            expect(dom.dispatchEvent(new MouseEvent('click', {cancelable: true}))).toBe(false);
        } finally {
            view.destroy();
        }
    });
});
