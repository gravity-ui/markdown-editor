// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {history, undo} from '@gravity-ui/markdown-editor/pm/history';
import {DOMParser, DOMSerializer, type Node} from '@gravity-ui/markdown-editor/pm/model';
import {EditorState, NodeSelection, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
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
    ':button[Read more]{href="/page?a=1&b=2" view="outline" color="blue" target="_blank"}';

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
    it('should parse a button as an inline atom between the texts around it', () => {
        const paragraph = markupParser.parse(`Press ${button} now`).child(0);
        expect(paragraph.childCount).toBe(3);
        expect(paragraph.child(1).type.name).toBe('button');
        expect(paragraph.child(1).isAtom).toBe(true);
        expect(paragraph.child(1).attrs).toEqual({
            href: '/page?a=1&b=2',
            view: 'outline',
            color: 'blue',
            target: '_blank',
            label: 'Read more',
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
            ':button[Label]{target="_blank" color="blue" view="outline" href="/page"}',
            ':button[Label]{href="/page" view="outline" color="blue" target="_blank"}',
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
        expect(doc.child(0).child(0).attrs.label).toBe('');
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
    it('should change attributes in separate undo steps and keep the label', () => {
        const {state, dispatch} = createState(button);
        const original = state().doc;
        dispatch(state().tr.setSelection(NodeSelection.create(state().doc, 1)));
        expect(setButtonAttrs(1, {view: 'normal', color: 'green'})(state(), dispatch)).toBe(true);
        expect(setButtonAttrs(1, {target: '_self', href: ''})(state(), dispatch)).toBe(true);
        expect(setButtonAttrs(1, {label: 'Open'})(state(), dispatch)).toBe(true);
        expect(serializer.serialize(state().doc)).toBe(
            ':button[Open]{view="normal" color="green"}',
        );
        expect(state().selection).toBeInstanceOf(NodeSelection);
        const changed = state();
        expect(setButtonAttrs(1, {label: 'Open'})(state(), dispatch)).toBe(true);
        expect(state()).toBe(changed);
        expect(undo(state(), dispatch)).toBe(true);
        expect(state().doc.child(0).child(0).attrs.label).toBe('Read more');
        expect(undo(state(), dispatch)).toBe(true);
        expect(state().doc.child(0).child(0).attrs.view).toBe('normal');
        expect(undo(state(), dispatch)).toBe(true);
        expect(state().doc.eq(original)).toBe(true);
        expect(setButtonAttrs(0, {view: 'flat'})(state(), dispatch)).toBe(false);
    });
    it.each([
        [button, 'Read more'],
        ['', 'Button'],
    ])('should copy the label of %j as plain text', (source, text) => {
        const node = source
            ? markupParser.parse(source).child(0).child(0)
            : buttonNodeType(schema).create();
        expect(
            schema
                .node('paragraph', null, [node])
                .textBetween(0, 1, '', (leaf) => String(leaf.type.spec.leafText?.(leaf))),
        ).toBe(text);
    });
    it('should render a selectable atom without navigation and open its settings', () => {
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
            expect(dom.contentEditable).toBe('false');
            expect(dom.textContent).toBe('Read more');
            expect(dom.dispatchEvent(new MouseEvent('click', {cancelable: true}))).toBe(false);
        } finally {
            view.destroy();
        }
    });
    it('should show the placeholder in an empty button', () => {
        const deps = new ExtensionsManager({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Button),
        }).build();
        const doc = deps.schema.node('doc', null, [
            deps.schema.node('paragraph', null, [buttonNodeType(deps.schema).create()]),
        ]);
        const view = new EditorView(document.createElement('div'), {
            state: EditorState.create({doc, schema: deps.schema}),
            nodeViews: deps.nodeViews,
        });
        try {
            expect((view.nodeDOM(1) as HTMLElement).textContent).toBe('Button');
        } finally {
            view.destroy();
        }
    });
});
