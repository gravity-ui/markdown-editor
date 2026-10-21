import {keydownHandler} from 'prosemirror-keymap';
import {Schema} from 'prosemirror-model';
import {EditorState, NodeSelection, type Plugin, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import type {DecorationSet, EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {applyCommand} from '../../../../tests/utils';
import {inlineAtomCursorPlugin} from '../../../plugins/InlineAtom';
import {LabelAttr, LabelColor, labelNodeName, labelNodeSpec, labelType} from '../Label/LabelSpecs';

import {DateAttr, dateNodeName, dateNodeSpec, dateType} from './YfmDateSpecs';
import {dateKeymap, editSelectedDate, insertDate, updateDate} from './commands';
import {dateEditPlugin, isDateEdited} from './edit-state';

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
        [labelNodeName]: labelNodeSpec,
        [dateNodeName]: dateNodeSpec,
    },
});

const {doc, paragraph: p, code_block: code, date, label} = builders(schema);

const day = (value: string) => ({[DateAttr.Date]: value});

type Doc = ReturnType<typeof doc>;

const stateWithCursor = (pmDoc: Doc, pos: number, plugins: Plugin[] = []) =>
    EditorState.create({schema, doc: pmDoc, selection: TextSelection.create(pmDoc, pos), plugins});

const stateWithSelectedDate = (pmDoc: Doc, pos: number, plugins: Plugin[] = []) =>
    EditorState.create({schema, doc: pmDoc, selection: NodeSelection.create(pmDoc, pos), plugins});

/** A minimal view: applies transactions in place, enough for keymaps. */
const createView = (initial: EditorState) => {
    let state = initial;
    return {
        get state() {
            return state;
        },
        dispatch: (tr) => {
            state = state.apply(tr);
        },
    } as EditorView;
};

describe('Date commands', () => {
    it('should insert a date at the cursor and open it for editing', () => {
        const state = stateWithCursor(doc(p('text')), 5, [dateEditPlugin()]);
        const {res, tr} = applyCommand(state, insertDate('2026-10-21'));

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(doc(p('text', date(day('2026-10-21')))));
        expect(tr.selection).toBeInstanceOf(NodeSelection);
        expect(tr.selection.from).toBe(5);
        expect(isDateEdited(state.apply(tr))).toBe(true);
    });

    it('should replace the selected text with a date', () => {
        const pmDoc = doc(p('a text b'));
        const state = EditorState.create({
            schema,
            doc: pmDoc,
            selection: TextSelection.create(pmDoc, 3, 7),
        });
        const {tr} = applyCommand(state, insertDate('2026-10-21'));

        expect(tr.doc).toMatchNode(doc(p('a ', date(day('2026-10-21')), ' b')));
    });

    it('should not insert a date into a code block', () => {
        const {res, tr} = applyCommand(
            stateWithCursor(doc(code('code')), 2),
            insertDate('2026-10-21'),
        );

        expect(res).toBe(false);
        expect(tr).toBeUndefined();
    });

    it('should not insert an invalid day', () => {
        const {res} = applyCommand(stateWithCursor(doc(p('text')), 1), insertDate('2026-02-30'));

        expect(res).toBe(false);
    });

    it('should update the selected date and keep it selected', () => {
        const pmDoc = doc(p('a', date(day('2026-10-21')), 'b'));
        const state = stateWithSelectedDate(pmDoc, 2, [dateEditPlugin()]);
        const {res, tr} = applyCommand(state, updateDate(2, '2028-02-29'));

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(doc(p('a', date(day('2028-02-29')), 'b')));
        expect(tr.selection).toBeInstanceOf(NodeSelection);
        expect(tr.selection.from).toBe(2);
    });

    it.each([
        ['an invalid day', 2, '2026-02-30'],
        ['a position without a date', 1, '2026-11-01'],
    ])('should not update the date with %s', (_case, pos, value) => {
        const pmDoc = doc(p('a', date(day('2026-10-21')), 'b'));
        const {res, tr} = applyCommand(stateWithSelectedDate(pmDoc, 2), updateDate(pos, value));

        expect(res).toBe(false);
        expect(tr).toBeUndefined();
    });

    it('should open the selected date for editing on Enter', () => {
        const pmDoc = doc(p('a', date(day('2026-10-21'))));
        const state = stateWithSelectedDate(pmDoc, 2, [dateEditPlugin()]);
        const {res, tr} = applyCommand(state, editSelectedDate);

        expect(res).toBe(true);
        expect(isDateEdited(state.apply(tr))).toBe(true);
        expect(applyCommand(stateWithCursor(pmDoc, 1), editSelectedDate).res).toBe(false);
    });

    it('should stop editing when the selection leaves the date', () => {
        const view = createView(stateWithCursor(doc(p('a')), 2, [dateEditPlugin()]));

        insertDate('2026-10-21')(view.state, view.dispatch);
        expect(isDateEdited(view.state)).toBe(true);

        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1)));
        expect(isDateEdited(view.state)).toBe(false);
    });
});

describe('Date keyboard navigation', () => {
    // a[date]b: the date is at 2, its edges are 2 and 3.
    const pmDoc = doc(p('a', date(day('2026-10-21')), 'b'));

    const press = (state: EditorState, key: string) => {
        const view = createView(state);
        const handled = keydownHandler(dateKeymap)(view, new KeyboardEvent('keydown', {key}));
        return {handled, selection: view.state.selection};
    };

    it('should step through both edges of the date to the right', () => {
        const step1 = press(stateWithCursor(pmDoc, 2), 'ArrowRight');
        expect(step1.selection).toBeInstanceOf(NodeSelection);
        expect(step1.selection.from).toBe(2);

        const step2 = press(stateWithSelectedDate(pmDoc, 2), 'ArrowRight');
        expect(step2.selection).toBeInstanceOf(TextSelection);
        expect(step2.selection.from).toBe(3);
    });

    it('should step through both edges of the date to the left', () => {
        const step1 = press(stateWithCursor(pmDoc, 3), 'ArrowLeft');
        expect(step1.selection).toBeInstanceOf(NodeSelection);

        const step2 = press(stateWithSelectedDate(pmDoc, 2), 'ArrowLeft');
        expect(step2.selection).toBeInstanceOf(TextSelection);
        expect(step2.selection.from).toBe(2);
    });

    it('should leave arrows away from a date to the editor', () => {
        expect(press(stateWithCursor(pmDoc, 1), 'ArrowRight').handled).toBe(false);
        expect(press(stateWithCursor(pmDoc, 4), 'ArrowLeft').handled).toBe(false);
    });

    it('should insert typed text outside the date at both edges', () => {
        const before = stateWithCursor(pmDoc, 2);
        const after = stateWithCursor(pmDoc, 3);

        expect(before.apply(before.tr.insertText('x')).doc).toMatchNode(
            doc(p('ax', date(day('2026-10-21')), 'b')),
        );
        expect(after.apply(after.tr.insertText('x')).doc).toMatchNode(
            doc(p('a', date(day('2026-10-21')), 'xb')),
        );
    });
});

describe('Date virtual cursor', () => {
    const datePlugin = inlineAtomCursorPlugin(dateType);
    const labelPlugin = inlineAtomCursorPlugin(labelType);

    const getWidgets = (plugin: Plugin, state: EditorState) =>
        (plugin.props.decorations?.call(plugin, state) as DecorationSet).find();

    it.each([
        ['before', 2, 0],
        ['after', 3, -1],
    ])('should draw the cursor %s the date', (_edge, pos, side) => {
        const pmDoc = doc(p('a', date(day('2026-10-21')), 'b'));
        const widgets = getWidgets(datePlugin, stateWithCursor(pmDoc, pos));

        expect(widgets).toHaveLength(1);
        expect(widgets[0].from).toBe(pos);
        expect(widgets[0].spec.side).toBe(side);
    });

    it('should draw one cursor between a label and a date', () => {
        const grayLabel = {[LabelAttr.Text]: 'Draft', [LabelAttr.Color]: LabelColor.Gray};
        const between = (pmDoc: Doc) => {
            const state = stateWithCursor(pmDoc, 3);
            return [...getWidgets(labelPlugin, state), ...getWidgets(datePlugin, state)];
        };

        const labelFirst = between(doc(p('a', label(grayLabel), date(day('2026-10-21')))));
        const dateFirst = between(doc(p('a', date(day('2026-10-21')), label(grayLabel))));

        expect(labelFirst).toHaveLength(1);
        expect(labelFirst[0].spec.side).toBe(-1);
        expect(dateFirst).toHaveLength(1);
        expect(dateFirst[0].spec.side).toBe(-1);
    });
});
