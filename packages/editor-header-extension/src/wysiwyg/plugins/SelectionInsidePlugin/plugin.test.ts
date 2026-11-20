// @vitest-environment jsdom
import {ListsSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {
    createTestEditor,
    description,
    header,
    headerContentMarkup,
    headerExtensions,
} from '../../../../tests/editor';
import {headerContentNodeType} from '../../extensions/HeaderContent/HeaderContentSpecs';

import {selectionInside} from './plugin';

const {createView} = createTestEditor(headerExtensions((builder) => builder.use(ListsSpecs)));

const next = 'Text';
const descriptionAndNext = header(description, next);

const blocks = {description: headerContentNodeType};

const selectBetween = (
    block: keyof typeof blocks,
    source: string,
    anchor: number,
    head: number,
) => {
    const editor = createView(source);
    const {doc} = editor.state;
    const selection = selectionInside(blocks[block])(
        editor,
        doc.resolve(anchor),
        doc.resolve(head),
    );
    return selection && [selection.anchor, selection.head];
};

describe('Selection inside plugin', () => {
    it.each<[string, keyof typeof blocks, string, number, number, number[]]>([
        ['from its start to the next block', 'description', descriptionAndNext, 3, 25, [3, 22]],
        ['from its middle to the next block', 'description', descriptionAndNext, 10, 25, [10, 22]],
        ['backwards from the next block', 'description', descriptionAndNext, 25, 3, [22, 3]],
        [
            'from its last paragraph to the next block',
            'description',
            header(headerContentMarkup(['First.', 'Second.']), next),
            11,
            21,
            [11, 18],
        ],
        [
            'from a list item to the next block',
            'description',
            header(headerContentMarkup(['- item']), next),
            5,
            13,
            [5, 9],
        ],
        ['past the end of the document', 'description', header(description), 3, 25, [3, 22]],
    ])(
        'should keep a selection that runs %s inside the %s',
        (_name, block, source, anchor, head, expected) => {
            expect(selectBetween(block, source, anchor, head)).toEqual(expected);
        },
    );

    it.each<[string, keyof typeof blocks, string, number, number]>([
        ['inside a paragraph', 'description', descriptionAndNext, 3, 10],
        [
            'over its paragraphs',
            'description',
            header(headerContentMarkup(['First.', 'Second.']), next),
            3,
            18,
        ],
        ['into the text of the next block', 'description', header(description, 'Text'), 3, 27],
        ['outside the description', 'description', header(description, 'Text'), 26, 29],
    ])(
        'should leave a selection %s of the %s to the editor',
        (_name, block, source, anchor, head) => {
            expect(selectBetween(block, source, anchor, head)).toBeNull();
        },
    );

    it('should build the selection on the document of the given positions', () => {
        const editor = createView(descriptionAndNext);
        const {doc} = editor.state.tr.insertText('New ', 3);
        const selection = selectionInside(headerContentNodeType)(
            editor,
            doc.resolve(3),
            doc.resolve(29),
        );
        expect(selection?.$anchor.doc).toBe(doc);
        expect(selection && [selection.anchor, selection.head]).toEqual([3, 26]);
    });
});
