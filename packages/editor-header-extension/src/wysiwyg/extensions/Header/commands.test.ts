// @vitest-environment jsdom
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {BoldSpecs, LinkSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {
    createTestEditor,
    header,
    headerExtensions,
    run,
    setCursor,
    title,
} from '../../../../tests/editor';

import {type RemovedParts, setHeaderPart, toggleHeaderPart} from './commands';
import {headerParts} from './utils';

const {markupParser, createView, markup} = createTestEditor(
    headerExtensions((builder) => builder.use(BoldSpecs).use(LinkSpecs, {})),
);

const defaultTitle = '::header-title[This is your start page]';
const text = 'Plain text';

describe('Header commands', () => {
    it.each([
        ['an empty header', [], {title: false}],
        ['a text only', [text], {title: false}],
        ['a title', [title], {title: true}],
        ['a title after a text', [text, title], {title: true}],
    ])('should read the blocks of a header with %s', (_name, blocks, parts) => {
        const doc = markupParser.parse(header(...blocks));
        expect(headerParts(doc.child(0))).toEqual(parts);
    });

    it.each([
        [[], [defaultTitle]],
        [
            [text, 'More'],
            [defaultTitle, text, 'More'],
        ],
    ])('should insert the title into %j', (before, after) => {
        const editor = createView(header(...before));
        expect(run(editor, setHeaderPart(0, 'title', true))).toBe(true);
        expect(markup(editor)).toBe(header(...after));
        expect(headerParts(editor.state.doc.child(0)).title).toBe(true);
        expect(run(editor, setHeaderPart(0, 'title', true))).toBe(false);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(header(...before));
    });

    it('should switch on the title in a header with only a text', () => {
        const editor = createView(header(text));
        setCursor(editor, 2 + 'Plain'.length);
        expect(run(editor, setHeaderPart(0, 'title', true))).toBe(true);
        expect(markup(editor)).toBe(header('::header-title[Plain text]'));
        const {$from, empty} = editor.state.selection;
        expect(empty).toBe(true);
        expect($from.parent.type.name).toBe('header_title');
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(header(text));
    });

    it.each([
        [[title], []],
        [[title, text], [text]],
    ])('should remove the title from %j', (before, after) => {
        const editor = createView(header(...before));
        expect(run(editor, setHeaderPart(0, 'title', false))).toBe(true);
        expect(markup(editor)).toBe(header(...after));
        expect(headerParts(editor.state.doc.child(0)).title).toBe(false);
        expect(run(editor, setHeaderPart(0, 'title', false))).toBe(false);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(header(...before));
    });

    it.each([
        ['marks', '**Bold** text'],
        ['a link', '[Link](/page) text'],
    ])('should keep a paragraph with %s and insert a new title', (_name, paragraph) => {
        const editor = createView(header(paragraph));
        expect(run(editor, setHeaderPart(0, 'title', true))).toBe(true);
        expect(markup(editor)).toBe(header(defaultTitle, paragraph));
    });

    it('should restore the removed title after undo and a second removal', () => {
        const source = header('::header-title[Team portal]{size="1" color="red"}', text);
        const editor = createView(source);
        const removed: RemovedParts = new Map();
        expect(run(editor, toggleHeaderPart(0, 'title', false, removed))).toBe(true);
        expect(markup(editor)).toBe(header(text));
        expect(run(editor, toggleHeaderPart(0, 'title', true, removed))).toBe(true);
        expect(markup(editor)).toBe(source);
        expect(undo(editor.state, editor.dispatch)).toBe(true);
        expect(markup(editor)).toBe(header(text));
        expect(run(editor, toggleHeaderPart(0, 'title', true, removed))).toBe(true);
        expect(markup(editor)).toBe(source);
    });

    it('should reject a position outside a header', () => {
        const editor = createView(`Before\n\n${header(title)}`);
        expect(run(editor, setHeaderPart(0, 'title', false))).toBe(false);
    });
});
