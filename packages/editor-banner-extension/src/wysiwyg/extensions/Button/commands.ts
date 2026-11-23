import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import type {ButtonModel} from '@gravity-ui/markdown-plugin-banner';

import {nodeBeside, selectNodeNear} from '../commands';

import {buttonNodeType} from './ButtonSpecs';

export const setButtonAttrs =
    (pos: number, attrs: Partial<ButtonModel & {label: string}>): Command =>
    (state, dispatch) => {
        const node = state.doc.nodeAt(pos);
        if (node?.type !== buttonNodeType(state.schema)) return false;
        if (dispatch) {
            const tr = state.tr;
            // An attribute step keeps the selection of the node, which keeps the settings window open.
            for (const [name, value] of Object.entries(attrs)) {
                if (node.attrs[name] !== value) tr.setNodeAttribute(pos, name, value);
            }
            if (tr.docChanged) dispatch(closeHistory(tr));
        }
        return true;
    };

/** The first press selects the button next to the cursor; the editor removes a selected node. */
const selectButtonNear = selectNodeNear(buttonNodeType, nodeBeside);

export const selectButtonBefore = selectButtonNear(-1);
export const selectButtonAfter = selectButtonNear(1);
