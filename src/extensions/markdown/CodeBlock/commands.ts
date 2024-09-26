import {newlineInCode, setBlockType} from 'prosemirror-commands';
import type {Command} from 'prosemirror-state';

import type {ExtensionDeps} from '../../../core';
import {toParagraph} from '../../base/BaseSchema';

import {codeBlockType} from './const';

export {newlineInCode};

export const resetCodeblock: Command = (state, dispatch, view) => {
    const {selection} = state;
    if (
        selection.empty &&
        selection.$from.parent.type === codeBlockType(state.schema) &&
        view?.endOfTextblock('backward', state)
    ) {
        return toParagraph(state, dispatch, view);
    }
    return false;
};

export const setCodeBlockType =
    ({serializer}: ExtensionDeps): Command =>
    (state, dispatch) => {
        const nodeType = codeBlockType(state.schema);

        if (!setBlockType(nodeType)(state)) return false;

        if (dispatch) {
            const markup = serializer.serialize(state.selection.content().content);
            dispatch(
                state.tr.replaceSelectionWith(
                    nodeType.createAndFill({}, markup ? state.schema.text(markup) : null)!,
                ),
            );
        }
        return true;
    };
