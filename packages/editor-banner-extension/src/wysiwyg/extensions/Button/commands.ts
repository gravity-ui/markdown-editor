import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Node, ResolvedPos, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    NodeSelection,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import type {ButtonModel} from '@gravity-ui/markdown-plugin-banner';

import {changedAttrs} from '../../utils/attrs';
import {singleLine} from '../../utils/directive';

import {ButtonNodeAttr, buttonNodeType, isButton} from './ButtonSpecs';
import {setButtonSettingsOpen} from './plugins/ButtonSettingsPlugin';

export const buttonNode = (
    schema: Schema,
    attrs?: Partial<ButtonModel & {label: string}>,
): Node | undefined => buttonNodeType(schema)?.create(attrs);

export function selectedButton({selection}: EditorState): {node: Node; pos: number} | null {
    return selection instanceof NodeSelection && isButton(selection.node)
        ? {node: selection.node, pos: selection.from}
        : null;
}

function plainText(doc: Node, from: number, to: number) {
    let plain = true;
    doc.nodesBetween(from, to, (node) => {
        if (node.isInline && !node.isText) plain = false;
        return plain;
    });
    return plain ? doc.textBetween(from, to) : '';
}

// A selected button gets a new button after it; selected plain text becomes the label.
function insertRange(state: EditorState): {from: number; to: number; label: string} | null {
    const {selection, doc} = state;
    const {$from, $to, empty} = selection;
    if (selectedButton(state)) return {from: selection.to, to: selection.to, label: ''};
    if (!(selection instanceof TextSelection) || !$from.sameParent($to)) return null;
    if (empty) return {from: $from.pos, to: $from.pos, label: ''};
    const text = plainText(doc, $from.pos, $to.pos);
    const label = singleLine(text).trim();
    if (!label) return null;
    const from = $from.pos + text.length - text.trimStart().length;
    return {from, to: from + text.trim().length, label};
}

const accepts = ($from: ResolvedPos, $to: ResolvedPos, node: Node) =>
    $from.parent.canReplaceWith($from.index(), $to.indexAfter(), node.type);

export const insertButton: Command = (state, dispatch) => {
    const {schema, doc} = state;
    const range = insertRange(state);
    const button = range && buttonNode(schema, {[ButtonNodeAttr.Label]: range.label});
    if (!range || !button) return false;
    const $from = doc.resolve(range.from);
    if (!accepts($from, doc.resolve(range.to), button)) return false;
    if (dispatch) {
        const spaced = range.from === range.to && isButton($from.nodeBefore);
        const tr = state.tr.replaceWith(
            range.from,
            range.to,
            spaced ? [schema.text(' '), button] : button,
        );
        const pos = range.from + (spaced ? 1 : 0);
        tr.setSelection(NodeSelection.create(tr.doc, pos));
        dispatch(setButtonSettingsOpen(tr, true).scrollIntoView());
    }
    return true;
};

export const setButtonAttrs =
    (pos: number, attrs: Partial<ButtonModel & {label: string}>): Command =>
    (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== buttonNodeType(state.schema)) return false;
        if (dispatch) {
            const tr = state.tr;
            // An attribute step keeps the selection of the node, which keeps the settings window open.
            for (const [name, value] of changedAttrs(node.attrs, attrs)) {
                tr.setNodeAttribute(pos, name, value);
            }
            if (tr.docChanged) dispatch(closeHistory(tr));
        }
        return true;
    };

/** The first press selects the button next to the cursor; the editor removes a selected node. */
const selectButtonNear =
    (dir: -1 | 1): Command =>
    (state, dispatch) => {
        const $cursor = state.selection instanceof TextSelection ? state.selection.$cursor : null;
        const node = dir < 0 ? $cursor?.nodeBefore : $cursor?.nodeAfter;
        if (!$cursor || node?.type !== buttonNodeType(state.schema)) return false;
        if (dispatch) {
            const pos = dir < 0 ? $cursor.pos - node.nodeSize : $cursor.pos;
            dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)).scrollIntoView());
        }
        return true;
    };

export const selectButtonBefore = selectButtonNear(-1);
export const selectButtonAfter = selectButtonNear(1);
