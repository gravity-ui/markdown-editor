// @vitest-environment jsdom
import {Clipboard} from '@gravity-ui/markdown-editor/extensions';
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {Fragment, Slice} from '@gravity-ui/markdown-editor/pm/model';
import {BoldSpecs, CodeSpecs, ListsSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {
    countNodes,
    createTestEditor,
    drop,
    header,
    headerExtensions,
    paste,
    setCursor,
    textPos,
} from '../../../../../../tests/editor';
import {title} from '../../../../../../tests/title';
import {headerTitleNodeName} from '../../HeaderTitleSpecs';

const {createView, markup, markupParser} = createTestEditor(
    headerExtensions((builder) =>
        builder.use(BoldSpecs).use(CodeSpecs).use(ListsSpecs, {}).use(Clipboard, {}),
    ),
);

const source = `${header(title, 'Text')}\n\nAfter`;
const withTitle = (text: string) => source.replace(title, `::header-title[${text}]`);
const inTitle = (editor: ReturnType<typeof createView>, offset = 'Team'.length) =>
    setCursor(editor, textPos(editor, 'Team portal') + offset);

describe('Header title paste', () => {
    it.each([
        ['Markdown of the editor', {'text/yfm': '- **one**\n- two'}, 'Teamone two portal'],
        [
            'plain text with Markdown',
            {'text/plain': ' **one** and `two`'},
            'Team one and two portal',
        ],
        ['plain text on several lines', {'text/plain': ' one\n\ntwo'}, 'Team one two portal'],
        [
            'HTML of a list',
            {'text/html': '<ul><li>one</li><li>two</li></ul>'},
            'Teamone two portal',
        ],
    ])('should paste %s into the title as one line of plain text', (_name, data, text) => {
        const editor = createView(source);
        inTitle(editor);
        paste(editor, data);
        expect(markup(editor)).toBe(withTitle(text));
        expect(countNodes(editor, headerTitleNodeName)).toBe(1);
        expect(editor.state.doc.nodeAt(1)?.child(0).marks).toEqual([]);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(source);
    });

    it('should keep the formatting of a paste outside the title', () => {
        const editor = createView(source);
        setCursor(editor, textPos(editor, 'After'));
        paste(editor, {'text/yfm': '**one**'});
        expect(markup(editor)).toBe(source.replace('After', '**one**After'));
    });

    it('should drop paragraphs dragged into the title as one line', () => {
        const editor = createView(source);
        const doc = markupParser.parse('First\n\nSecond');
        drop(
            editor,
            new Slice(Fragment.from(doc.content), 1, 1),
            textPos(editor, 'Team portal') + 'Team '.length,
        );
        expect(markup(editor)).toBe(withTitle('Team First Secondportal'));
    });
});
