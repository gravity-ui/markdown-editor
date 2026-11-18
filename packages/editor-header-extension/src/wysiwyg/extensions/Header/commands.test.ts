// @vitest-environment jsdom
import {undo} from '@gravity-ui/markdown-editor/pm/history';
import {BoldSpecs, LinkSpecs} from '@gravity-ui/markdown-editor/specs';
import {describe, expect, it} from 'vitest';

import {
    createTestEditor,
    description,
    header,
    headerContentMarkup,
    headerExtensions,
    run,
} from '../../../../tests/editor';

import {type RemovedParts, setHeaderPart, toggleHeaderPart} from './commands';
import {headerParts} from './utils';

const {createView, markup} = createTestEditor(
    headerExtensions((builder) => builder.use(BoldSpecs).use(LinkSpecs)),
);

const next = 'Text';
const preview = headerContentMarkup([
    'Here you will find the main rules and recommendations for working in our services',
]);

describe('Header part commands', () => {
    it('should remove the description and keep the other blocks', () => {
        const editor = createView(header(description, next));
        expect(run(editor, setHeaderPart(0, 'content', false))).toBe(true);
        expect(markup(editor)).toBe(header(next));
        expect(headerParts(editor.state.doc.child(0))).toEqual({content: false});
    });

    it('should leave an empty paragraph after removing the only description', () => {
        const editor = createView(header(description));
        expect(run(editor, setHeaderPart(0, 'content', false))).toBe(true);
        expect(editor.state.doc.child(0).childCount).toBe(1);
        expect(editor.state.doc.child(0).child(0).type.name).toBe('paragraph');
        expect(editor.state.doc.child(0).child(0).childCount).toBe(0);
    });

    it('should add the description before the other blocks', () => {
        const editor = createView(header(next, 'More'));
        expect(run(editor, setHeaderPart(0, 'content', true))).toBe(true);
        expect(markup(editor)).toBe(header(preview, next, 'More'));
    });

    it('should replace the empty paragraph of a header with the description', () => {
        const editor = createView(':::header\n:::');
        expect(run(editor, setHeaderPart(0, 'content', true))).toBe(true);
        expect(markup(editor)).toBe(header(preview));
    });

    it('should turn the only paragraph of a header into the description', () => {
        const editor = createView(header(next));
        expect(run(editor, setHeaderPart(0, 'content', true))).toBe(true);
        expect(markup(editor)).toBe(header(headerContentMarkup([next])));
    });

    it.each([
        ['add a description that exists', header(description), true],
        ['remove a description that does not exist', header(next), false],
    ])('should not %s', (_name, source, enabled) => {
        const editor = createView(source);
        const {doc} = editor.state;
        expect(run(editor, setHeaderPart(0, 'content', enabled))).toBe(false);
        expect(editor.state.doc).toBe(doc);
    });

    it('should reject a position outside a header', () => {
        const editor = createView(`${next}\n\n${header(description)}`);
        expect(run(editor, setHeaderPart(0, 'content', false))).toBe(false);
    });

    it('should undo each change in one step', () => {
        const editor = createView(header(description, next));
        const removed: RemovedParts = new Map();
        run(editor, toggleHeaderPart(0, 'content', false, removed));
        run(editor, toggleHeaderPart(0, 'content', true, removed));
        run(editor, undo);
        expect(markup(editor)).toBe(header(next));
        run(editor, undo);
        expect(markup(editor)).toBe(header(description, next));
    });
});

describe('Header part switch', () => {
    const edited = headerContentMarkup(['**Edited** text with a [link](/page).', 'Second.']);

    it('should restore the removed description with its text', () => {
        const editor = createView(header(edited, next));
        const removed: RemovedParts = new Map();
        expect(run(editor, toggleHeaderPart(0, 'content', false, removed))).toBe(true);
        expect(markup(editor)).toBe(header(next));
        expect(removed.has('content')).toBe(true);
        expect(run(editor, toggleHeaderPart(0, 'content', true, removed))).toBe(true);
        expect(markup(editor)).toBe(header(edited, next));
    });

    it('should restore the description again after the switch on is undone', () => {
        const editor = createView(header(edited, next));
        const removed: RemovedParts = new Map();
        run(editor, toggleHeaderPart(0, 'content', false, removed));
        run(editor, toggleHeaderPart(0, 'content', true, removed));
        run(editor, undo);
        expect(markup(editor)).toBe(header(next));
        expect(run(editor, toggleHeaderPart(0, 'content', true, removed))).toBe(true);
        expect(markup(editor)).toBe(header(edited, next));
    });

    it('should restore the description instead of taking the only paragraph', () => {
        const editor = createView(header(edited));
        const removed: RemovedParts = new Map();
        run(editor, toggleHeaderPart(0, 'content', false, removed));
        editor.dispatch(editor.state.tr.insertText(next, 2));
        run(editor, toggleHeaderPart(0, 'content', true, removed));
        expect(markup(editor)).toBe(header(edited, next));
    });

    it('should add a new description when nothing was removed', () => {
        const editor = createView(header(next, 'More'));
        expect(run(editor, toggleHeaderPart(0, 'content', true, new Map()))).toBe(true);
        expect(markup(editor)).toBe(header(preview, next, 'More'));
    });

    it('should keep the removed description when the command only checks', () => {
        const editor = createView(header(edited, next));
        const removed: RemovedParts = new Map();
        expect(toggleHeaderPart(0, 'content', false, removed)(editor.state)).toBe(true);
        expect(removed.size).toBe(0);
        expect(markup(editor)).toBe(header(edited, next));
    });
});
