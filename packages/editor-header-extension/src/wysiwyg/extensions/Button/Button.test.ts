// @vitest-environment jsdom
import {ExtensionsManager} from '@gravity-ui/markdown-editor/core';
import {deleteSelection} from '@gravity-ui/markdown-editor/pm/commands';
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
import {WButtonNodeView} from './ButtonNodeView';
import {ButtonSpecs, buttonNodeType} from './ButtonSpecs';
import {insertButton, selectButtonAfter, selectButtonBefore, setButtonAttrs} from './commands';

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

const scriptUrl = ['javascript', 'alert(1)'].join(':');
const unsafeUrls = [scriptUrl, 'data:text/html,<b>x</b>', 'vbscript:run', 'file:///etc/passwd'];

const buttonPos = (doc: Node) => {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found < 0 && node.type.name === 'button') found = pos;
    });
    return found;
};

function createButtonView(doc: (nodeSchema: typeof schema) => Node) {
    const deps = new ExtensionsManager({
        extensions: (builder) => builder.use(BaseSchemaSpecs, {}).use(Button),
    }).build();
    return new EditorView(document.createElement('div'), {
        state: EditorState.create({doc: doc(deps.schema), schema: deps.schema}),
        nodeViews: deps.nodeViews,
    });
}

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
        [
            ':button[Label]{href="/image&copy;.png?a=1&amp;b=2&#10;"}',
            ':button[Label]{href="/image&copy;.png?a=1&amp;b=2&#10;" view="action" color="standard"}',
        ],
        [
            ':button[Label]{href="/a?x=\\"1\\""}',
            ':button[Label]{href="/a?x=%221%22" view="action" color="standard"}',
        ],
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
    it('should replace a color that the new view lacks', () => {
        const {state, dispatch} = createState(':button[Open]{view="action" color="standard"}');
        expect(setButtonAttrs(1, {view: 'normal'})(state(), dispatch)).toBe(true);
        expect(serializer.serialize(state().doc)).toBe(':button[Open]{view="normal" color="gray"}');
    });
    it.each([...unsafeUrls, ` ${scriptUrl.toUpperCase()}`, 'java\tscript:run'])(
        'should reject the unsafe address %j',
        (href) => {
            const {state, dispatch} = createState(button);
            const doc = state().doc;
            expect(setButtonAttrs(1, {href, label: 'Changed'})(state(), dispatch)).toBe(false);
            expect(state().doc).toBe(doc);
        },
    );
    it.each([
        ['Backspace after a button', selectButtonBefore, `Go ${button} now`, 1],
        ['Delete before a button', selectButtonAfter, `Go ${button} now`, 0],
        ['Backspace at the end of a row', selectButtonBefore, button, 1],
        ['Delete at the start of a row', selectButtonAfter, button, 0],
    ])(
        'should select the button on %s and remove it only as a selected node',
        (_name, command, source, side) => {
            const {state, dispatch} = createState(source);
            const pos = buttonPos(state().doc);
            dispatch(state().tr.setSelection(TextSelection.create(state().doc, pos + side)));
            const doc = state().doc;
            expect(command(state(), dispatch)).toBe(true);
            expect(state().doc).toBe(doc);
            expect(state().selection).toBeInstanceOf(NodeSelection);
            expect(state().selection.from).toBe(pos);
            expect(command(state(), dispatch)).toBe(false);
            expect(deleteSelection(state(), dispatch)).toBe(true);
            expect(buttons(state().doc)).toHaveLength(0);
            expect(undo(state(), dispatch)).toBe(true);
            expect(state().doc.eq(doc)).toBe(true);
        },
    );
    it.each([
        ['Backspace in a text', selectButtonBefore, 'Go now', 3, 3],
        ['Delete in a text', selectButtonAfter, 'Go now', 3, 3],
        ['Backspace before a button', selectButtonBefore, `${button} now`, 1, 1],
        ['Delete after a button', selectButtonAfter, `Go ${button}`, 5, 5],
        ['Backspace with a selected range', selectButtonBefore, `Go ${button} now`, 2, 6],
    ])('should leave %s to the editor', (_name, command, source, from, to) => {
        const {state, dispatch} = createState(source);
        dispatch(state().tr.setSelection(TextSelection.create(state().doc, from, to)));
        const before = state();
        expect(command(state(), dispatch)).toBe(false);
        expect(state()).toBe(before);
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
    it.each(unsafeUrls)(
        'should drop the unsafe address %j of a pasted and of a rendered button',
        (href) => {
            const container = document.createElement('div');
            const pasted = document.createElement('a');
            pasted.className = 'g-md-button-plugin';
            pasted.setAttribute('href', href);
            pasted.setAttribute('data-view', 'outline');
            pasted.textContent = 'Open';
            container.append(pasted);
            expect(buttons(DOMParser.fromSchema(schema).parse(container))).toEqual([
                {
                    type: 'button',
                    attrs: {
                        href: '',
                        view: 'outline',
                        color: 'gray',
                        target: '_self',
                        label: 'Open',
                    },
                },
            ]);
            const node = buttonNodeType(schema).create({href, label: 'Open'});
            const rendered = DOMSerializer.fromSchema(schema).serializeNode(node) as HTMLElement;
            expect(rendered.hasAttribute('href')).toBe(false);
            expect(new WButtonNodeView(node).dom.hasAttribute('href')).toBe(false);
        },
    );
    it.each([
        [{label: 'Open', href: '/page'}, 'Open', '/page', null],
        [{label: 'Open'}, 'Open', null, 'button'],
        [{href: '/page'}, 'Button', '/page', null],
        [{}, 'Button', null, 'button'],
    ])(
        'should expose the button %j as a control that opens its settings',
        (attrs, name, href, role) => {
            const view = createButtonView((nodeSchema) =>
                nodeSchema.node('doc', null, [
                    nodeSchema.node('paragraph', null, [buttonNodeType(nodeSchema).create(attrs)]),
                ]),
            );
            try {
                const dom = view.nodeDOM(1) as HTMLElement;
                expect(dom.getAttribute('href')).toBe(href);
                expect(dom.getAttribute('role')).toBe(role);
                expect(dom.getAttribute('aria-haspopup')).toBe('dialog');
                expect(dom.tabIndex).toBe(-1);
                expect(dom.textContent).toBe(name);
            } finally {
                view.destroy();
            }
        },
    );
    it.each([
        ['the style', {view: 'outline', color: 'blue'}],
        ['the link and the target', {href: '/other', target: '_blank'}],
        ['an empty link', {href: ''}],
        ['the label', {label: 'Read'}],
        ['an empty label', {label: ''}],
    ] as const)('should update the selected button in place when %s changes', (_name, attrs) => {
        const view = createButtonView((nodeSchema) =>
            nodeSchema.node('doc', null, [
                nodeSchema.node('paragraph', null, [
                    buttonNodeType(nodeSchema).create({label: 'Open', href: '/page'}),
                ]),
            ]),
        );
        const domState = (element: HTMLElement) => ({
            attrs: Object.fromEntries(
                Array.from(element.attributes, ({name, value}) => [
                    name,
                    name === 'class' ? value.split(' ').sort().join(' ') : value,
                ]),
            ),
            html: element.innerHTML,
        });
        try {
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, 1)));
            const dom = view.nodeDOM(1) as HTMLElement;
            expect(setButtonAttrs(1, attrs)(view.state, view.dispatch)).toBe(true);
            const node = view.state.doc.nodeAt(1) as Node;
            const fresh = new WButtonNodeView(node).dom;
            fresh.classList.add('ProseMirror-selectednode');
            fresh.draggable = true;
            expect(view.nodeDOM(1)).toBe(dom);
            expect(view.state.selection).toMatchObject({from: 1, node});
            expect(domState(dom)).toEqual(domState(fresh));
        } finally {
            view.destroy();
        }
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
