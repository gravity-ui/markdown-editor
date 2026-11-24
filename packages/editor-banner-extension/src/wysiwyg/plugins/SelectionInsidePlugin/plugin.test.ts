import {Schema} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {describe, expect, it} from 'vitest';

import {selectionInside} from './plugin';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {group: 'block', content: 'text*'},
        text: {},
        test_box: {group: 'block', content: 'block+'},
        test_line: {group: 'block', content: 'text*'},
    },
});

// 0 box 1 line 2 "Title" 7 /line 8 p 9 "Text" 13 /p 14 /box 15 p 16 "After" 21 /p 22
const doc = schema.node('doc', null, [
    schema.node('test_box', null, [
        schema.node('test_line', null, schema.text('Title')),
        schema.node('paragraph', null, schema.text('Text')),
    ]),
    schema.node('paragraph', null, schema.text('After')),
]);

const between = (anchor: number, head: number) => {
    const selection = selectionInside((target) => target.nodes.test_line)(
        {} as EditorView,
        doc.resolve(anchor),
        doc.resolve(head),
    );
    return selection && {anchor: selection.anchor, head: selection.head};
};

describe('Selection inside plugin', () => {
    it.each([
        [3, 8],
        [3, 9],
    ])('should keep the selection from %i to %i inside the node', (anchor, head) => {
        expect(between(anchor, head)).toEqual({anchor: 3, head: 7});
    });

    it('should keep a backward selection inside the node', () => {
        expect(between(5, 0)).toEqual({anchor: 5, head: 2});
    });

    it.each([
        ['a selection inside the node', 3, 6],
        ['a selection into the text of the next block', 3, 11],
        ['a selection that starts outside the node', 10, 18],
    ])('should leave %s to the editor', (_name, anchor, head) => {
        expect(between(anchor, head)).toBeNull();
    });
});
