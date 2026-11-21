import type {Node, ResolvedPos, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    NodeSelection,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import {type ButtonModel, buttonModel, safeLinkUrl} from '@gravity-ui/markdown-plugin-banner';

import {selectNodeNear, setNodeAttrs} from '../commands';
import {singleLine} from '../directive';

import {ButtonAttr, buttonNodeType, isButton} from './ButtonSpecs';
import {openButtonSettings} from './plugins/ButtonSettingsPlugin/const';

export type ButtonAttrs = ButtonModel & {[ButtonAttr.Label]: string};

const buttonLabelText = (value: unknown) => singleLine(String(value ?? '')).trim();

export const buttonNode = (schema: Schema, attrs?: Partial<ButtonAttrs>): Node | undefined =>
    buttonNodeType(schema)?.create(attrs);

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

function insertRange(state: EditorState): {from: number; to: number; label: string} | null {
    const {selection, doc} = state;
    const {$from, $to, empty} = selection;
    const selected = selectedButton(state);
    if (selected) return {from: selection.to, to: selection.to, label: ''};
    if (!(selection instanceof TextSelection) || !$from.sameParent($to)) return null;
    if (empty) return {from: $from.pos, to: $from.pos, label: ''};
    const text = plainText(doc, $from.pos, $to.pos);
    const label = buttonLabelText(text);
    if (!label) return null;
    const from = $from.pos + text.length - text.trimStart().length;
    return {from, to: from + text.trim().length, label};
}

const accepts = ($from: ResolvedPos, $to: ResolvedPos, node: Node) =>
    $from.parent.canReplaceWith($from.index(), $to.indexAfter(), node.type);

export const insertButton: Command = (state, dispatch) => {
    const {schema, doc} = state;
    const range = insertRange(state);
    const button = range && buttonNode(schema, {[ButtonAttr.Label]: range.label});
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
        dispatch(openButtonSettings(tr).scrollIntoView());
    }
    return true;
};

export const setButtonAttrs = setNodeAttrs<ButtonAttrs>(
    buttonNodeType,
    (attrs) => ({...buttonModel(attrs), [ButtonAttr.Label]: buttonLabelText(attrs.label)}),
    {accept: ({href}) => !href || safeLinkUrl(href) !== null, history: true},
);

const selectButtonNear = selectNodeNear(buttonNodeType, ($cursor, dir) => {
    const node = dir < 0 ? $cursor.nodeBefore : $cursor.nodeAfter;
    return node ? {node, pos: dir < 0 ? $cursor.pos - node.nodeSize : $cursor.pos} : null;
});

export const selectButtonBefore = selectButtonNear(-1);
export const selectButtonAfter = selectButtonNear(1);
