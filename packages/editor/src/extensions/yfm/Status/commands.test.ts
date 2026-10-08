import {keydownHandler} from 'prosemirror-keymap';
import {Schema} from 'prosemirror-model';
import {EditorState, NodeSelection, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import type {EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {applyCommand} from '../../../../tests/utils';

import {StatusAttr, StatusColor, statusNodeName, statusNodeSpec} from './StatusSpecs';
import {
    insertStatus,
    moveCursorLeftOfStatus,
    moveCursorRightOfStatus,
    selectStatusOnLeft,
    selectStatusOnRight,
    statusKeymap,
    updateStatus,
} from './commands';
import {removeEmptyStatusPlugin} from './remove-empty-plugin';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        text: {group: 'inline'},
        paragraph: {group: 'block', content: 'inline*', toDOM: () => ['p', 0]},
        code_block: {
            group: 'block',
            content: 'text*',
            marks: '',
            code: true,
            toDOM: () => ['pre', ['code', 0]],
        },
        [statusNodeName]: statusNodeSpec,
    },
});

const {doc, paragraph: p, code_block: code, status} = builders(schema);

const grayStatus = (text: string) => ({
    [StatusAttr.Text]: text,
    [StatusAttr.Color]: StatusColor.Gray,
});

const stateWithCursor = (pmDoc: ReturnType<typeof doc>, pos: number) =>
    EditorState.create({schema, doc: pmDoc, selection: TextSelection.create(pmDoc, pos)});

const stateWithEmptyBadge = () => {
    const pmDoc = doc(p('text', status(grayStatus(''))));
    return EditorState.create({
        schema,
        doc: pmDoc,
        selection: NodeSelection.create(pmDoc, 5),
        plugins: [removeEmptyStatusPlugin()],
    });
};

describe('Status commands', () => {
    it('should insert a badge at the cursor and select it', () => {
        const pmDoc = doc(p('text'));
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, 5), insertStatus('Draft'));

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(doc(p('text', status(grayStatus('Draft')))));
        expect(tr.selection).toBeInstanceOf(NodeSelection);
        expect(tr.selection.from).toBe(5);
    });

    it('should not insert a badge into a code block', () => {
        const pmDoc = doc(code('code'));
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, 2), insertStatus('Draft'));

        expect(res).toBe(false);
        expect(tr).toBeUndefined();
    });

    it('should change the color by position', () => {
        const pmDoc = doc(p(status(grayStatus('Draft'))));
        const {res, tr} = applyCommand(
            stateWithCursor(pmDoc, 1),
            updateStatus(1, {[StatusAttr.Color]: StatusColor.Green}),
        );

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(
            doc(p(status({[StatusAttr.Text]: 'Draft', [StatusAttr.Color]: StatusColor.Green}))),
        );
        expect(tr.selection).toBeInstanceOf(NodeSelection);
    });

    it('should change the caption by position', () => {
        const pmDoc = doc(p(status(grayStatus('Draft'))));
        const {res, tr} = applyCommand(
            stateWithCursor(pmDoc, 1),
            updateStatus(1, {[StatusAttr.Text]: 'Done'}),
        );

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(doc(p(status(grayStatus('Done')))));
    });

    it('should do nothing when there is no badge at the position', () => {
        const pmDoc = doc(p('text'));
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, 1), updateStatus(1, {}));

        expect(res).toBe(false);
        expect(tr).toBeUndefined();
    });
});

describe('Status keyboard navigation', () => {
    // a|[Draft]|b: 2 is the left edge of the badge, 3 is the right edge.
    const pmDoc = doc(p('a', status(grayStatus('Draft')), 'b'));

    it.each([
        ['left', moveCursorLeftOfStatus, 3, 2],
        ['right', moveCursorRightOfStatus, 2, 3],
    ])('should move the cursor %s past the badge', (_dir, command, from, to) => {
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, from), command);

        expect(res).toBe(true);
        expect(tr.selection).toBeInstanceOf(TextSelection);
        expect(tr.selection.empty).toBe(true);
        expect(tr.selection.from).toBe(to);
    });

    it.each([
        ['left', selectStatusOnLeft, 3],
        ['right', selectStatusOnRight, 2],
    ])('should select the badge on the %s', (_dir, command, from) => {
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, from), command);

        expect(res).toBe(true);
        expect(tr.selection).toBeInstanceOf(NodeSelection);
        expect(tr.selection.from).toBe(2);
    });

    it.each([
        ['moveCursorLeftOfStatus', moveCursorLeftOfStatus, 2],
        ['moveCursorRightOfStatus', moveCursorRightOfStatus, 3],
        ['selectStatusOnLeft', selectStatusOnLeft, 2],
        ['selectStatusOnRight', selectStatusOnRight, 3],
    ])('should return false from %s without a badge on that side', (_name, command, from) => {
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, from), command);

        expect(res).toBe(false);
        expect(tr).toBeUndefined();
    });

    it('should return false for a non-empty text selection', () => {
        const state = EditorState.create({
            schema,
            doc: pmDoc,
            selection: TextSelection.create(pmDoc, 1, 2),
        });

        expect(moveCursorRightOfStatus(state)).toBe(false);
        expect(selectStatusOnRight(state)).toBe(false);
    });

    const pressKey = (pos: number, init: KeyboardEventInit) => {
        let state = stateWithCursor(pmDoc, pos);
        const view = {
            get state() {
                return state;
            },
            dispatch: (tr) => {
                state = state.apply(tr);
            },
        } as EditorView;

        const handled = keydownHandler(statusKeymap)(view, new KeyboardEvent('keydown', init));
        return {handled, selection: state.selection};
    };

    it('should step past the badge on a plain arrow', () => {
        const {handled, selection} = pressKey(3, {key: 'ArrowLeft'});

        expect(handled).toBe(true);
        expect(selection).toBeInstanceOf(TextSelection);
        expect(selection.from).toBe(2);
    });

    it('should select the badge on Ctrl with an arrow', () => {
        const {handled, selection} = pressKey(2, {key: 'ArrowRight', ctrlKey: true});

        expect(handled).toBe(true);
        expect(selection).toBeInstanceOf(NodeSelection);
        expect(selection.from).toBe(2);
    });

    it.each([
        ['Shift', {shiftKey: true}],
        ['Alt', {altKey: true}],
        ['Meta', {metaKey: true}],
    ])('should ignore an arrow with %s', (_name, modifiers) => {
        expect(pressKey(3, {key: 'ArrowLeft', ...modifiers}).handled).toBe(false);
        expect(pressKey(2, {key: 'ArrowRight', ...modifiers}).handled).toBe(false);
    });

    it('should ignore vertical arrows', () => {
        expect(pressKey(3, {key: 'ArrowUp'}).handled).toBe(false);
        expect(pressKey(2, {key: 'ArrowDown', ctrlKey: true}).handled).toBe(false);
    });
});

describe('Empty status plugin', () => {
    it('should keep a selected badge with an empty caption', () => {
        const state = stateWithEmptyBadge();

        expect(state.apply(state.tr).doc).toMatchNode(doc(p('text', status(grayStatus('')))));
    });

    it('should remove a badge with an empty caption when it loses the selection', () => {
        const state = stateWithEmptyBadge();
        const tr = state.tr.setSelection(TextSelection.create(state.doc, 1));

        expect(state.apply(tr).doc).toMatchNode(doc(p('text')));
    });
});
