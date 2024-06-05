import type {Command} from 'prosemirror-state';
import {removeParentNodeOfType} from 'prosemirror-utils';

import type {ActionSpec, ExtensionDeps, Parser} from '../../../../core';
import {TableNode} from '../const';
import {isIntoTable} from '../helpers';

const mdTamplate = `

| Heading | Heading |
| ------- | ------- |
| Text    | Text    |
| Text    | Text    |

`.trim();

const createTableFactory =
    (parser: Parser): Command =>
    (state, dispatch) => {
        if (isIntoTable(state)) {
            return false;
        }

        if (dispatch) {
            const node = parser.parse(mdTamplate);
            dispatch(state.tr.replaceSelectionWith(node).scrollIntoView());
        }

        return true;
    };

const removeTable: Command = (state, dispatch) => {
    if (isIntoTable(state)) {
        dispatch?.(removeParentNodeOfType(state.schema.nodes[TableNode.Table])(state.tr));

        return true;
    }

    return false;
};

export const createTableAction = ({markupParser}: ExtensionDeps): ActionSpec => ({
    isActive: isIntoTable,
    isEnable: createTableFactory(markupParser),
    run: createTableFactory(markupParser),
});

export const deleteTableAction: ActionSpec = {
    isEnable: removeTable,
    run: removeTable,
};
