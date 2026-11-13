import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import type {ButtonModel} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../i18n';

import {buttonNodeType} from './ButtonSpecs';

export const insertButton: Command = (state, dispatch) => {
    const type = buttonNodeType(state.schema);
    const {$from, $to} = state.selection;
    if (!$from.parent.canReplaceWith($from.index(), $to.index(), type)) return false;
    if (dispatch) {
        const button = type.create(null, state.schema.text(i18n('button-placeholder')));
        dispatch(state.tr.replaceSelectionWith(button, false).scrollIntoView());
    }
    return true;
};

export const setButtonAttrs =
    (pos: number, attrs: Partial<ButtonModel>): Command =>
    (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== buttonNodeType(state.schema)) return false;
        // Each change in the button panel is its own undo step.
        dispatch?.(closeHistory(state.tr.setNodeMarkup(pos, undefined, {...node.attrs, ...attrs})));
        return true;
    };
