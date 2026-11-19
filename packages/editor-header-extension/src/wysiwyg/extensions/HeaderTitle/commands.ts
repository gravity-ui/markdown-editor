import {get$Cursor, pType} from '@gravity-ui/markdown-editor';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';
import {type Command, TextSelection} from '@gravity-ui/markdown-editor/pm/state';

import {headerNodeType} from '../Header/HeaderSpecs';
import {siblingBlock, stopAtBlockEdge} from '../commands';

import {headerTitleNodeType} from './HeaderTitleSpecs';

/**
 * Enter never splits the title. At the end of a title outside a banner it adds a paragraph after the title.
 */
export const leaveHeaderTitle: Command = (state, dispatch) => {
    const {$from, empty} = state.selection;
    if ($from.parent.type !== headerTitleNodeType(state.schema)) return false;
    const after = $from.after();
    const container = $from.node(-1);
    const index = $from.indexAfter(-1);
    const paragraph = pType(state.schema);
    if (
        dispatch &&
        empty &&
        $from.pos === $from.end() &&
        container.type !== headerNodeType(state.schema) &&
        container.canReplaceWith(index, index, paragraph)
    ) {
        const tr = state.tr.insert(after, paragraph.create());
        dispatch(tr.setSelection(TextSelection.create(tr.doc, after + 1)).scrollIntoView());
    }
    return true;
};

/** Deleting a range from the start of the title into the next blocks empties the title and keeps it. */
export const deleteHeaderTitleText: Command = (state, dispatch) => {
    const {$from, $to, empty} = state.selection;
    if (empty || $from.parent.type !== headerTitleNodeType(state.schema)) return false;
    if ($from.parentOffset > 0 || $to.pos <= $from.end()) return false;
    if (dispatch) {
        const tr = state.tr.delete($from.pos, $from.end());
        tr.deleteRange(tr.mapping.map($from.after()), tr.mapping.map($to.pos));
        tr.setSelection(TextSelection.create(tr.doc, $from.pos));
        dispatch(tr.scrollIntoView());
    }
    return true;
};

const holdHeaderTitleEdge =
    (dir: -1 | 1): Command =>
    (state) => {
        const $cursor = get$Cursor(state.selection);
        if ($cursor?.parent.type !== headerTitleNodeType(state.schema)) return false;
        const sibling = siblingBlock($cursor, dir);
        return Boolean(sibling && !sibling.node.isAtom);
    };

const stopAtHeaderTitleEdge = (dir: -1 | 1) =>
    chainCommands(holdHeaderTitleEdge(dir), stopAtBlockEdge(headerTitleNodeType)(dir));

export const stopAtHeaderTitleStart = stopAtHeaderTitleEdge(-1);
export const stopAtHeaderTitleEnd = stopAtHeaderTitleEdge(1);
