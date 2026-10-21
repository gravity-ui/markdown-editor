import {keydownHandler} from 'prosemirror-keymap';
import {Schema} from 'prosemirror-model';
import {EditorState, NodeSelection, type Plugin, TextSelection} from 'prosemirror-state';
import {builders} from 'prosemirror-test-builder';
import type {DecorationSet, EditorView} from 'prosemirror-view';
import {describe, expect, it} from 'vitest';

import {applyCommand} from '../../../../tests/utils';
import {isMac} from '../../../utils/platform';

import {LabelAttr, LabelColor, labelNodeName, labelNodeSpec} from './LabelSpecs';
import {
    editSelectedLabel,
    insertLabel,
    labelKeymap,
    leaveLabelToLeft,
    leaveLabelToRight,
    removeEmptyLabel,
    selectLabelOnLeft,
    selectLabelOnRight,
    updateLabel,
} from './commands';
import {getLabelCursorState, labelCursorPlugin} from './cursor-plugin';
import {isLabelEdited, labelEditPlugin} from './edit-state';
import {removeEmptyLabelPlugin} from './remove-empty-plugin';

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
    },
});

const {doc, paragraph: p, code_block: code, label} = builders(schema);

const grayLabel = (text: string) => ({
    [LabelAttr.Text]: text,
    [LabelAttr.Color]: LabelColor.Gray,
});

type Doc = ReturnType<typeof doc>;

const stateWithCursor = (pmDoc: Doc, pos: number, plugins: Plugin[] = []) =>
    EditorState.create({schema, doc: pmDoc, selection: TextSelection.create(pmDoc, pos), plugins});

const stateWithSelectedLabel = (pmDoc: Doc, pos: number, plugins: Plugin[] = []) =>
    EditorState.create({schema, doc: pmDoc, selection: NodeSelection.create(pmDoc, pos), plugins});

/** A minimal view: applies transactions in place, enough for keymaps and plugin props. */
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

describe('Label commands', () => {
    it('should insert a label at the cursor and open it for editing', () => {
        const pmDoc = doc(p('text'));
        const state = stateWithCursor(pmDoc, 5, [labelEditPlugin()]);
        const {res, tr} = applyCommand(state, insertLabel('Draft'));

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(doc(p('text', label(grayLabel('Draft')))));
        expect(tr.selection).toBeInstanceOf(NodeSelection);
        expect(tr.selection.from).toBe(5);
        expect(isLabelEdited(state.apply(tr))).toBe(true);
    });

    it('should not insert a label into a code block', () => {
        const pmDoc = doc(code('code'));
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, 2), insertLabel('Draft'));

        expect(res).toBe(false);
        expect(tr).toBeUndefined();
    });

    it('should change the color by position', () => {
        const pmDoc = doc(p(label(grayLabel('Draft'))));
        const {res, tr} = applyCommand(
            stateWithCursor(pmDoc, 1),
            updateLabel(1, {[LabelAttr.Color]: LabelColor.Green}),
        );

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(
            doc(p(label({[LabelAttr.Text]: 'Draft', [LabelAttr.Color]: LabelColor.Green}))),
        );
        expect(tr.selection).toBeInstanceOf(NodeSelection);
    });

    it('should do nothing when there is no label at the position', () => {
        const pmDoc = doc(p('text'));
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, 1), updateLabel(1, {}));

        expect(res).toBe(false);
        expect(tr).toBeUndefined();
    });

    it('should keep the label open for editing while the caption is cleared and typed again', () => {
        const pmDoc = doc(p('a', label(grayLabel('Draft'))));
        const view = createView(
            stateWithCursor(pmDoc, 2, [labelEditPlugin(), removeEmptyLabelPlugin()]),
        );

        insertLabel('New')(view.state, view.dispatch);
        updateLabel(2, {[LabelAttr.Text]: ''})(view.state, view.dispatch);

        expect(view.state.doc).toMatchNode(
            doc(p('a', label(grayLabel('')), label(grayLabel('Draft')))),
        );
        expect(isLabelEdited(view.state)).toBe(true);

        updateLabel(2, {[LabelAttr.Text]: 'D'})(view.state, view.dispatch);
        updateLabel(2, {[LabelAttr.Text]: 'Done'})(view.state, view.dispatch);

        expect(view.state.doc).toMatchNode(
            doc(p('a', label(grayLabel('Done')), label(grayLabel('Draft')))),
        );
        expect(view.state.selection.from).toBe(2);
        expect(isLabelEdited(view.state)).toBe(true);
    });

    it('should remove an empty label and put the cursor in its place', () => {
        const pmDoc = doc(p('a', label(grayLabel('')), 'b'));
        const {res, tr} = applyCommand(stateWithSelectedLabel(pmDoc, 2), removeEmptyLabel(2));

        expect(res).toBe(true);
        expect(tr.doc).toMatchNode(doc(p('ab')));
        expect(tr.selection).toBeInstanceOf(TextSelection);
        expect(tr.selection.from).toBe(2);
    });

    it('should keep a label with a caption', () => {
        const pmDoc = doc(p('a', label(grayLabel('Draft')), 'b'));
        const {res, tr} = applyCommand(stateWithSelectedLabel(pmDoc, 2), removeEmptyLabel(2));

        expect(res).toBe(false);
        expect(tr).toBeUndefined();
    });
});

describe('Label editing state', () => {
    const pmDoc = doc(p('a', label(grayLabel('Draft')), 'b'));

    it('should open a label selected by the keyboard without editing', () => {
        const view = createView(stateWithCursor(pmDoc, 2, [labelEditPlugin()]));

        selectLabelOnRight(view.state, view.dispatch);

        expect(view.state.selection).toBeInstanceOf(NodeSelection);
        expect(isLabelEdited(view.state)).toBe(false);
    });

    it('should start editing the selected label on Enter', () => {
        const view = createView(stateWithSelectedLabel(pmDoc, 2, [labelEditPlugin()]));

        expect(
            keydownHandler(labelKeymap)(view, new KeyboardEvent('keydown', {key: 'Enter'})),
        ).toBe(true);
        expect(isLabelEdited(view.state)).toBe(true);
        expect(view.state.doc).toMatchNode(pmDoc);
    });

    it('should not handle Enter without a selected label', () => {
        expect(editSelectedLabel(stateWithCursor(pmDoc, 2))).toBe(false);
    });

    it('should start editing on a press on the label', () => {
        const plugin = labelEditPlugin();
        const view = createView(stateWithCursor(pmDoc, 1, [plugin]));
        const root = document.createElement('div');
        const labelDom = document.createElement('span');
        labelDom.className = 'g-md-label';
        labelDom.innerHTML =
            '<span class="g-label__text"><span class="g-label__content">Draft</span></span>';
        root.append(labelDom);
        Object.assign(view, {dom: root, posAtDOM: (node: Node) => (node === labelDom ? 2 : -1)});

        const event = new MouseEvent('mousedown', {button: 0, cancelable: true});
        Object.defineProperty(event, 'target', {
            value: labelDom.querySelector('.g-label__content'),
        });
        const handled = plugin.props.handleDOMEvents?.mousedown?.call(plugin, view, event);

        expect(handled).toBe(true);
        expect(event.defaultPrevented).toBe(true);
        expect(view.state.selection).toBeInstanceOf(NodeSelection);
        expect(view.state.selection.from).toBe(2);
        expect(isLabelEdited(view.state)).toBe(true);
    });

    it('should stop editing when the selection leaves the label', () => {
        const view = createView(stateWithCursor(pmDoc, 2, [labelEditPlugin()]));

        insertLabel('New')(view.state, view.dispatch);
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1)));

        expect(isLabelEdited(view.state)).toBe(false);
    });
});

describe('Label keyboard navigation', () => {
    // a|[Draft]|b: 2 is the left edge of the label, 3 is the right edge.
    const pmDoc = doc(p('a', label(grayLabel('Draft')), 'b'));

    const press = (state: EditorState, init: KeyboardEventInit) => {
        const view = createView(state);
        const handled = keydownHandler(labelKeymap)(view, new KeyboardEvent('keydown', init));
        return {handled, selection: view.state.selection};
    };

    it.each([
        ['left', selectLabelOnLeft, 3],
        ['right', selectLabelOnRight, 2],
    ])('should select the label on the %s', (_dir, command, from) => {
        const {res, tr} = applyCommand(stateWithCursor(pmDoc, from), command);

        expect(res).toBe(true);
        expect(tr.selection).toBeInstanceOf(NodeSelection);
        expect(tr.selection.from).toBe(2);
    });

    it.each([
        ['left', leaveLabelToLeft, 2],
        ['right', leaveLabelToRight, 3],
    ])('should leave the selected label to the %s edge', (_dir, command, to) => {
        const {res, tr} = applyCommand(stateWithSelectedLabel(pmDoc, 2), command);

        expect(res).toBe(true);
        expect(tr.selection).toBeInstanceOf(TextSelection);
        expect(tr.selection.empty).toBe(true);
        expect(tr.selection.from).toBe(to);
    });

    it.each([
        ['selectLabelOnLeft', selectLabelOnLeft, 2],
        ['selectLabelOnRight', selectLabelOnRight, 3],
    ])('should return false from %s without a label on that side', (_name, command, from) => {
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

        expect(selectLabelOnRight(state)).toBe(false);
        expect(leaveLabelToRight(state)).toBe(false);
    });

    it('should step through the edge, the label and the other edge on plain arrows', () => {
        const right1 = press(stateWithCursor(pmDoc, 2), {key: 'ArrowRight'});
        expect(right1.handled).toBe(true);
        expect(right1.selection).toBeInstanceOf(NodeSelection);

        const right2 = press(stateWithSelectedLabel(pmDoc, 2), {key: 'ArrowRight'});
        expect(right2.selection).toBeInstanceOf(TextSelection);
        expect(right2.selection.from).toBe(3);

        const left1 = press(stateWithCursor(pmDoc, 3), {key: 'ArrowLeft'});
        expect(left1.selection).toBeInstanceOf(NodeSelection);

        const left2 = press(stateWithSelectedLabel(pmDoc, 2), {key: 'ArrowLeft'});
        expect(left2.selection).toBeInstanceOf(TextSelection);
        expect(left2.selection.from).toBe(2);
    });

    it('should leave arrows away from a label to the editor', () => {
        expect(press(stateWithCursor(pmDoc, 1), {key: 'ArrowRight'}).handled).toBe(false);
        expect(press(stateWithCursor(pmDoc, 4), {key: 'ArrowLeft'}).handled).toBe(false);
    });

    // prosemirror-keymap resolves `Mod-` to `Meta-` on macOS and to `Ctrl-` elsewhere.
    const modKey: KeyboardEventInit = isMac() ? {metaKey: true} : {ctrlKey: true};

    it.each([
        ['Mod', modKey],
        ['Shift', {shiftKey: true}],
        ['Alt', {altKey: true}],
    ])('should leave an arrow with %s to the editor', (_name, modifiers) => {
        expect(press(stateWithCursor(pmDoc, 3), {key: 'ArrowLeft', ...modifiers}).handled).toBe(
            false,
        );
        expect(press(stateWithCursor(pmDoc, 2), {key: 'ArrowRight', ...modifiers}).handled).toBe(
            false,
        );
    });
});

describe('Label virtual cursor', () => {
    const pmDoc = doc(p('a', label(grayLabel('Draft')), 'b'));
    const plugin = labelCursorPlugin();

    const getWidgets = (state: EditorState) => {
        const decorations = plugin.props.decorations?.call(plugin, state) as DecorationSet;
        return decorations.find();
    };

    it.each([
        ['before', 2, 0],
        ['after', 3, -1],
    ])('should draw the cursor %s the label', (_edge, pos, side) => {
        const state = stateWithCursor(pmDoc, pos, [plugin]);
        const widgets = getWidgets(state);

        expect(getLabelCursorState(state)).toEqual({active: true, side});
        expect(widgets).toHaveLength(1);
        expect(widgets[0].from).toBe(pos);
        expect(widgets[0].spec.side).toBe(side);
        expect(plugin.props.attributes).toBeInstanceOf(Function);
        expect((plugin.props.attributes as (s: EditorState) => unknown)(state)).toEqual({
            class: 'no-cursor',
        });
    });

    it.each([
        ['away from the label', stateWithCursor(pmDoc, 1)],
        ['on the selected label', stateWithSelectedLabel(pmDoc, 2)],
    ])('should keep the native cursor %s', (_case, state) => {
        expect(getLabelCursorState(state)).toBeNull();
        expect(getWidgets(state)).toHaveLength(0);
    });

    it('should insert typed text outside the label at both edges', () => {
        const before = stateWithCursor(pmDoc, 2);
        const after = stateWithCursor(pmDoc, 3);

        expect(before.apply(before.tr.insertText('x')).doc).toMatchNode(
            doc(p('ax', label(grayLabel('Draft')), 'b')),
        );
        expect(after.apply(after.tr.insertText('x')).doc).toMatchNode(
            doc(p('a', label(grayLabel('Draft')), 'xb')),
        );
    });
});

describe('Empty label plugin', () => {
    const stateWithEmptyLabel = () =>
        stateWithSelectedLabel(doc(p('text', label(grayLabel('')))), 5, [removeEmptyLabelPlugin()]);

    it('should keep a selected label with an empty caption', () => {
        const state = stateWithEmptyLabel();

        expect(state.apply(state.tr).doc).toMatchNode(doc(p('text', label(grayLabel('')))));
    });

    it('should remove a label with an empty caption when it loses the selection', () => {
        const state = stateWithEmptyLabel();
        const tr = state.tr.setSelection(TextSelection.create(state.doc, 1));

        expect(state.apply(tr).doc).toMatchNode(doc(p('text')));
    });
});
