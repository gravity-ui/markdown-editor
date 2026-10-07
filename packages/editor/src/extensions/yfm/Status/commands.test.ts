import {Schema} from 'prosemirror-model';
import {EditorState, NodeSelection, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import {describe, expect, it} from 'vitest';

import {applyCommand} from '../../../../tests/utils';
import {Colors} from '../Color/const';

import {StatusAttr, statusNodeName, statusNodeSpec} from './StatusSpecs';
import {insertStatus, updateStatus} from './commands';
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
    [StatusAttr.Color]: Colors.Gray,
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
            updateStatus(1, {[StatusAttr.Color]: Colors.Green}),
        );

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(
            doc(p(status({[StatusAttr.Text]: 'Draft', [StatusAttr.Color]: Colors.Green}))),
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
