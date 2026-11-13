import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, NodeSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {ButtonModel} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../i18n';

import {buttonNodeType} from './ButtonSpecs';

export const insertButton: Command = (state, dispatch) => {
    const type = buttonNodeType(state.schema);
    const {$from, $to} = state.selection;
    if (!$from.parent.canReplaceWith($from.index(), $to.index(), type)) return false;
    if (dispatch) {
        const button = type.create({label: i18n('button-placeholder')});
        dispatch(state.tr.replaceSelectionWith(button, false).scrollIntoView());
    }
    return true;
};

export const setButtonAttrs =
    (pos: number, attrs: Partial<ButtonModel & {label: string}>): Command =>
    (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== buttonNodeType(state.schema)) return false;
        const changed = Object.entries(attrs).some(([name, value]) => node.attrs[name] !== value);
        if (dispatch && changed) {
            const tr = state.tr.setNodeMarkup(pos, undefined, {...node.attrs, ...attrs});
            // Replacing the node drops its selection, which keeps the settings window open.
            if (state.selection instanceof NodeSelection && state.selection.from === pos) {
                tr.setSelection(NodeSelection.create(tr.doc, pos));
            }
            // Each change in the settings window is its own undo step.
            dispatch(closeHistory(tr));
        }
        return true;
    };
