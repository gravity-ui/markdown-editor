import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, NodeSelection, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {type ButtonModel, safeLinkUrl} from '@gravity-ui/markdown-plugin-header';

import {buttonNodeType} from './ButtonSpecs';

export const setButtonAttrs =
    (pos: number, attrs: Partial<ButtonModel & {label: string}>): Command =>
    (state, dispatch) => {
        if (attrs.href && safeLinkUrl(attrs.href) === null) return false;
        const node = state.doc.nodeAt(pos);
        if (node?.type !== buttonNodeType(state.schema)) return false;
        if (dispatch) {
            const tr = state.tr;
            // An attribute step keeps the selection of the node, which keeps the settings window open.
            for (const [name, value] of Object.entries(attrs)) {
                if (node.attrs[name] !== value) tr.setNodeAttribute(pos, name, value);
            }
            // Each change in the settings window is its own undo step.
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
