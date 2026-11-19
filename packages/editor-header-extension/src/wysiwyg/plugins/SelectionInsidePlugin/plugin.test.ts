// @vitest-environment jsdom
import type {Node, NodeType, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {builders} from '@gravity-ui/markdown-editor/pm/test-builder';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {describe, expect, it} from 'vitest';

import {createTestEditor, headerExtensions} from '../../../../tests/editor';
import {TestParts, testContent, testTitle} from '../../../../tests/parts';

import {selectionInside} from './plugin';

const {schema} = createTestEditor(headerExtensions(TestParts()));

const {doc, p, header, title, content} = builders(schema, {
    doc: {nodeType: 'doc'},
    p: {nodeType: 'paragraph'},
    header: {nodeType: 'header'},
    title: {nodeType: testTitle},
    content: {nodeType: testContent},
}) as unknown as Record<string, (...children: (Node | string)[]) => Node>;

const blocks: Record<string, (target: Schema) => NodeType> = {
    title: (target) => target.nodes[testTitle],
    description: (target) => target.nodes[testContent],
};

// A selection dragged up to the first text position after the block stays inside the block.
const sources = {
    titleAndNext: [header(title('Team portal'), p('Text'))],
    descriptionAndNext: [header(content(p('Description')), p('Text'))],
    twoParagraphs: [header(content(p('First'), p('Second')), p('Text'))],
    descriptionLast: [header(content(p('Description')))],
    descriptionAndBlockAfter: [header(content(p('Description'))), p('After')],
};

function selectBetween(block: string, source: keyof typeof sources, anchor: number, head: number) {
    const root = doc(...sources[source]);
    const view = {} as EditorView;
    const selection = selectionInside(blocks[block])(
        view,
        root.resolve(anchor),
        root.resolve(head),
    );
    return selection && [selection.anchor, selection.head];
}

describe('Selection inside plugin', () => {
    it.each<[string, string, keyof typeof sources, number, number, number[]]>([
        ['from its start to the next block', 'title', 'titleAndNext', 2, 15, [2, 13]],
        ['backwards from the next block', 'title', 'titleAndNext', 15, 5, [13, 5]],
        ['from its start to the next block', 'description', 'descriptionAndNext', 3, 17, [3, 14]],
        ['from its middle to the next block', 'description', 'descriptionAndNext', 6, 17, [6, 14]],
        [
            'from its last paragraph to the next block',
            'description',
            'twoParagraphs',
            10,
            19,
            [10, 16],
        ],
        ['past the end of the banner', 'description', 'descriptionAndBlockAfter', 3, 18, [3, 14]],
    ])(
        'should keep a selection that runs %s inside the %s',
        (_name, block, source, anchor, head, expected) => {
            expect(selectBetween(block, source, anchor, head)).toEqual(expected);
        },
    );

    it.each<[string, string, keyof typeof sources, number, number]>([
        ['inside its text', 'title', 'titleAndNext', 2, 6],
        ['over its paragraphs', 'description', 'twoParagraphs', 3, 13],
        ['into the text of the next block', 'description', 'descriptionAndNext', 3, 19],
        ['outside the block', 'description', 'descriptionAndNext', 17, 19],
    ])(
        'should leave a selection %s of the %s to the editor',
        (_name, block, source, anchor, head) => {
            expect(selectBetween(block, source, anchor, head)).toBeNull();
        },
    );
});
