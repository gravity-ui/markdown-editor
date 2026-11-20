// @vitest-environment jsdom
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {NodeSelection, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import {BoldSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {createTestEditor, headerExtensions} from '../../../../tests/editor';
import {TestParts, testContent, testImage, testTitle} from '../../../../tests/parts';
import {runCommand} from '../commands';

import {type RemovedParts, setHeaderPart, toggleHeaderPart} from './commands';
import {type HeaderPart, headerPartOrder, headerPartTypes, headerParts} from './parts';

const {schema, createView} = createTestEditor(
    headerExtensions((builder) => builder.use(BoldSpecs).use(TestParts())),
);

const {p, header, image, title, content, strong} = builders(schema, {
    p: {nodeType: 'paragraph'},
    header: {nodeType: 'header'},
    image: {nodeType: testImage},
    title: {nodeType: testTitle},
    content: {nodeType: testContent},
    strong: {markType: 'strong'},
}) as unknown as Record<string, (...content: (Node | string | object)[]) => Node>;

const newPart: Record<HeaderPart, () => Node> = {
    image: () => image(),
    title: () => title('Title'),
    content: () => content(p('Description')),
};

function editorWith(banner: Node, before: Node[] = []) {
    const editor = createView('');
    const tr = editor.state.tr.replaceWith(0, editor.state.doc.content.size, [...before, banner]);
    editor.dispatch(tr.setSelection(TextSelection.atStart(tr.doc)));
    return editor;
}

const banner = (editor: {state: {doc: Node}}) => editor.state.doc.lastChild;

const permutations = <T>(items: readonly T[]): T[][] =>
    items.length
        ? items.flatMap((item, i) =>
              permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [
                  item,
                  ...rest,
              ]),
          )
        : [[]];

describe('Header parts', () => {
    it('should find the part node types by their node specs', () => {
        expect(Object.keys(headerPartTypes(schema)).sort()).toEqual(['content', 'image', 'title']);
        expect(headerPartTypes(schema).title?.name).toBe(testTitle);
    });

    it.each([
        {
            name: 'a paragraph',
            blocks: [p('Text')],
            parts: {image: false, title: false, content: false},
        },
        {name: 'a title', blocks: [title('A')], parts: {image: false, title: true, content: false}},
        {
            name: 'every part in a custom order',
            blocks: [content(p('C')), p('Text'), title('A'), image()],
            parts: {image: true, title: true, content: true},
        },
    ])('should read the parts of a banner with $name', ({blocks, parts}) => {
        expect(headerParts(header(...blocks))).toEqual(parts);
    });

    it.each(
        permutations(headerPartOrder).map((order) => ({order: order.join(' → '), parts: order})),
    )(
        'should insert the parts as image → title → description when switched on as $order',
        ({parts}) => {
            const editor = editorWith(header(p('Text'), p('More')));
            for (const part of parts) {
                expect(runCommand(editor, setHeaderPart(0, part, true))).toBe(true);
            }
            expect(
                banner(editor)?.eq(
                    header(
                        image(),
                        title('Title'),
                        content(p('Description')),
                        p('Text'),
                        p('More'),
                    ),
                ),
            ).toBe(true);
        },
    );

    it('should keep the custom order of the parts and insert a new part after its predecessors', () => {
        const editor = editorWith(header(content(p('C')), p('Text'), image()));
        expect(runCommand(editor, setHeaderPart(0, 'title', true))).toBe(true);
        expect(
            banner(editor)?.eq(header(content(p('C')), p('Text'), image(), title('Title'))),
        ).toBe(true);
    });

    it.each(headerPartOrder.map((part) => ({part})))(
        'should replace the only empty paragraph with a new $part',
        ({part}) => {
            const editor = editorWith(header(p()));
            expect(runCommand(editor, setHeaderPart(0, part, true))).toBe(true);
            expect(banner(editor)?.eq(header(newPart[part]()))).toBe(true);
        },
    );

    it.each([
        {part: 'title' as const, source: p('Plain'), result: [title('Plain')]},
        {part: 'content' as const, source: p('Plain'), result: [content(p('Plain'))]},
        {
            part: 'content' as const,
            source: p(strong('Bold'), ' text'),
            result: [content(p(strong('Bold'), ' text'))],
        },
        {
            part: 'title' as const,
            source: p(strong('Bold'), ' text'),
            result: [title('Title'), p(strong('Bold'), ' text')],
        },
        {part: 'image' as const, source: p('Plain'), result: [image(), p('Plain')]},
    ])(
        'should turn the only paragraph into a $part when the part takes it',
        ({part, source, result}) => {
            const editor = editorWith(header(source));
            expect(runCommand(editor, setHeaderPart(0, part, true))).toBe(true);
            expect(banner(editor)?.eq(header(...result))).toBe(true);
        },
    );

    it.each([
        {name: 'one of several blocks', before: [title('A'), p('Text')], after: [p('Text')]},
        {name: 'the only block', before: [title('A')], after: [p()]},
    ])('should remove the part when it is $name', ({before, after}) => {
        const editor = editorWith(header(...before));
        expect(runCommand(editor, setHeaderPart(0, 'title', false))).toBe(true);
        expect(banner(editor)?.eq(header(...after))).toBe(true);
        expect(runCommand(editor, setHeaderPart(0, 'title', false))).toBe(false);
    });

    it.each(headerPartOrder.map((part) => ({part})))(
        'should undo the switch of $part in one step',
        ({part}) => {
            const source = header(p('Text'));
            const editor = editorWith(source);
            runCommand(editor, setHeaderPart(0, part, true));
            runCommand(editor, setHeaderPart(0, part, false));
            expect(undo(editor.state, editor.dispatch)).toBe(true);
            expect(headerParts(banner(editor) ?? header())[part]).toBe(true);
            expect(undo(editor.state, editor.dispatch)).toBe(true);
            expect(banner(editor)?.eq(source)).toBe(true);
        },
    );

    it.each(headerPartOrder.map((part) => ({part})))(
        'should undo a new $part that replaced the only empty paragraph in one step',
        ({part}) => {
            const source = header(p());
            const editor = editorWith(source);
            runCommand(editor, setHeaderPart(0, part, true));
            expect(undo(editor.state, editor.dispatch)).toBe(true);
            expect(banner(editor)?.eq(source)).toBe(true);
        },
    );

    it('should restore the removed node with its content and attributes', () => {
        const removed: RemovedParts = new Map();
        const custom = {
            image: image({src: '/a.png'}),
            title: title({size: '1'}, 'Team portal'),
            content: content(p(strong('Bold'), ' text'), p('More')),
        };
        const source = header(custom.image, custom.title, custom.content, p('Text'));
        const editor = editorWith(source);
        for (const part of headerPartOrder) {
            expect(runCommand(editor, toggleHeaderPart(0, part, false, removed))).toBe(true);
        }
        expect(banner(editor)?.eq(header(p('Text')))).toBe(true);
        for (const part of [...headerPartOrder].reverse()) {
            expect(runCommand(editor, toggleHeaderPart(0, part, true, removed))).toBe(true);
        }
        expect(banner(editor)?.eq(source)).toBe(true);
    });

    it('should restore the removed node after undo and a second switch', () => {
        const removed: RemovedParts = new Map();
        const source = header(title({size: '1'}, 'Team portal'), p('Text'));
        const editor = editorWith(source);
        runCommand(editor, toggleHeaderPart(0, 'title', false, removed));
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        runCommand(editor, toggleHeaderPart(0, 'title', false, removed));
        expect(runCommand(editor, toggleHeaderPart(0, 'title', true, removed))).toBe(true);
        expect(banner(editor)?.eq(source)).toBe(true);
    });

    it('should restore the removed node again after its restoration is undone', () => {
        const removed: RemovedParts = new Map();
        const source = header(title({size: '1'}, 'Team portal'), p('Text'));
        const editor = editorWith(source);
        runCommand(editor, toggleHeaderPart(0, 'title', false, removed));
        runCommand(editor, toggleHeaderPart(0, 'title', true, removed));
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(banner(editor)?.eq(header(p('Text')))).toBe(true);
        expect(runCommand(editor, toggleHeaderPart(0, 'title', true, removed))).toBe(true);
        expect(banner(editor)?.eq(source)).toBe(true);
    });

    it('should move a cursor out of a removed part and keep a selected banner selected', () => {
        const editor = editorWith(header(title('Team portal'), p('Text')));
        editor.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 3)));
        runCommand(editor, setHeaderPart(0, 'title', false));
        expect(editor.state.selection.$from.parent.textContent).toBe('Text');
        editor.dispatch(editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, 0)));
        runCommand(editor, setHeaderPart(0, 'image', true));
        expect(editor.state.selection).toBeInstanceOf(NodeSelection);
        expect(editor.state.selection.from).toBe(0);
    });

    it('should reject a position outside a banner', () => {
        const editor = editorWith(header(p('Text')), [p('Before')]);
        expect(runCommand(editor, setHeaderPart(0, 'title', true))).toBe(false);
        expect(
            runCommand(editor, setHeaderPart(editor.state.doc.child(0).nodeSize, 'title', true)),
        ).toBe(true);
    });
});

describe('Header parts without node types', () => {
    const editor = createTestEditor(headerExtensions(TestParts([testTitle])));

    it('should switch only the parts that have a node type', () => {
        const view = editor.createView(':::header\nText\n:::');
        expect(Object.keys(headerPartTypes(editor.schema))).toEqual(['title']);
        expect(runCommand(view, setHeaderPart(0, 'image', true))).toBe(false);
        expect(runCommand(view, setHeaderPart(0, 'content', true))).toBe(false);
        expect(runCommand(view, setHeaderPart(0, 'title', true))).toBe(true);
    });
});
