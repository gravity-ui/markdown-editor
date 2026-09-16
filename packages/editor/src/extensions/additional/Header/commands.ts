import type {Node} from '#pm/model';
import {type Command, type EditorState, NodeSelection, TextSelection} from '#pm/state';
import {isNodeEmpty} from 'src/utils/nodes';

import {
    type HeaderActionAttrs,
    type HeaderAttrs,
    MAX_HEADER_ACTIONS,
    headerActionType,
    headerActionsType,
    headerTitleType,
    headerType,
} from './HeaderSpecs';

export type FoundHeader = {pos: number; node: Node};

/** Find the selected header or the header containing the cursor. */
export function findHeader(state: EditorState): FoundHeader | null {
    const type = headerType(state.schema);
    const {selection} = state;

    if (selection instanceof NodeSelection && selection.node.type === type) {
        return {pos: selection.from, node: selection.node};
    }

    const {$from} = selection;
    for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type === type) return {pos: $from.before(depth), node};
    }
    return null;
}

function headerAt(state: EditorState, pos: number): Node | null {
    if (pos < 0 || pos >= state.doc.content.size) return null;
    const node = state.doc.nodeAt(pos);
    return node?.type === headerType(state.schema) ? node : null;
}

function headerActionAt(state: EditorState, pos: number): Node | null {
    if (pos < 0 || pos >= state.doc.content.size) return null;
    const node = state.doc.nodeAt(pos);
    return node?.type === headerActionType(state.schema) ? node : null;
}

function slotPositions(headerPos: number, header: Node) {
    const titlePos = headerPos + 1;
    const descriptionPos = titlePos + header.child(0).nodeSize;
    const actionsPos = descriptionPos + header.child(1).nodeSize;
    return {titlePos, descriptionPos, actionsPos};
}

/** Read current attributes so consecutive changes preserve one another. */
export const setHeaderAttrs =
    (pos: number, patch: Partial<HeaderAttrs>): Command =>
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        if (Object.entries(patch).every(([key, value]) => node.attrs[key] === value)) return false;

        dispatch?.(state.tr.setNodeMarkup(pos, null, {...node.attrs, ...patch}));
        return true;
    };

export const removeHeader =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;

        dispatch?.(state.tr.delete(pos, pos + node.nodeSize));
        return true;
    };

export const addHeaderAction =
    (headerPos: number, attrs?: Partial<HeaderActionAttrs>): Command =>
    (state, dispatch) => {
        const header = headerAt(state, headerPos);
        if (!header) return false;

        const actions = header.child(2);
        if (actions.childCount >= MAX_HEADER_ACTIONS) return false;

        const action = headerActionType(state.schema).createAndFill(attrs ?? null);
        if (!action) return false;

        if (dispatch) {
            const insertAt = slotPositions(headerPos, header).actionsPos + actions.nodeSize - 1;
            const tr = state.tr.insert(insertAt, action);
            dispatch(tr.setSelection(TextSelection.create(tr.doc, insertAt + 1)).scrollIntoView());
        }
        return true;
    };

export function findHeaderAction(state: EditorState): FoundHeader | null {
    const type = headerActionType(state.schema);
    const {$from} = state.selection;

    for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type === type) return {pos: $from.before(depth), node};
    }
    return null;
}

export const setHeaderActionAttrs =
    (pos: number, patch: Partial<HeaderActionAttrs>): Command =>
    (state, dispatch) => {
        const node = headerActionAt(state, pos);
        if (!node) return false;
        if (Object.entries(patch).every(([key, value]) => node.attrs[key] === value)) return false;

        dispatch?.(state.tr.setNodeMarkup(pos, null, {...node.attrs, ...patch}));
        return true;
    };

export const setHeaderActionType =
    (type: HeaderActionAttrs['type']): Command =>
    (state, dispatch) => {
        const found = findHeaderAction(state);
        return found ? setHeaderActionAttrs(found.pos, {type})(state, dispatch) : false;
    };

export const removeHeaderActionAt =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = headerActionAt(state, pos);
        if (!node) return false;

        if (dispatch) {
            const tr = state.tr.delete(pos, pos + node.nodeSize);
            dispatch(
                tr
                    .setSelection(TextSelection.near(tr.doc.resolve(Math.max(pos - 1, 0)), -1))
                    .scrollIntoView(),
            );
        }
        return true;
    };

export const removeHeaderAction =
    (headerPos: number, index: number): Command =>
    (state, dispatch) => {
        const header = headerAt(state, headerPos);
        if (!header) return false;

        const actions = header.child(2);
        if (index < 0 || index >= actions.childCount) return false;

        let from = slotPositions(headerPos, header).actionsPos + 1;
        for (let i = 0; i < index; i++) from += actions.child(i).nodeSize;

        return removeHeaderActionAt(from)(state, dispatch);
    };

/** Replace an empty paragraph or insert after the current block. */
export const toHeader: Command = (state, dispatch) => {
    const type = headerType(state.schema);
    if (findHeader(state)) return false;

    const {$from} = state.selection;
    if ($from.depth < 1) return false;

    const parent = $from.node(1);
    const parentPos = $from.before(1);
    const index = $from.index(0);
    if (!state.doc.canReplaceWith(index, index + 1, type)) return false;

    const header = type.createAndFill();
    if (!header) return false;

    if (dispatch) {
        const replaceable = parent.isTextblock && isNodeEmpty(parent);
        const insertAt = replaceable ? parentPos : parentPos + parent.nodeSize;

        const tr = state.tr;
        if (replaceable) tr.replaceWith(parentPos, parentPos + parent.nodeSize, header);
        else tr.insert(insertAt, header);

        const {paragraph} = state.schema.nodes;
        const afterHeader = insertAt + header.nodeSize;
        if (paragraph && afterHeader >= tr.doc.content.size)
            tr.insert(afterHeader, paragraph.create());

        dispatch(tr.setSelection(TextSelection.create(tr.doc, insertAt + 2)).scrollIntoView());
    }
    return true;
};

/** Move to the following paragraph, creating one if needed. */
export const exitHeaderForward: Command = (state, dispatch) => {
    const found = findHeader(state);
    if (!found) return false;

    const {paragraph} = state.schema.nodes;
    if (!paragraph) return false;

    if (dispatch) {
        const after = found.pos + found.node.nodeSize;
        const tr = state.tr;
        const next = tr.doc.nodeAt(after);
        if (!next || !next.isTextblock) tr.insert(after, paragraph.create());
        dispatch(tr.setSelection(TextSelection.create(tr.doc, after + 1)).scrollIntoView());
    }
    return true;
};

function moveHeaderSlot(direction: -1 | 1): Command {
    return (state, dispatch) => {
        const {$from, empty} = state.selection;
        if (!empty) return false;

        const found = findHeader(state);
        if (!found) return false;

        const {titlePos, descriptionPos, actionsPos} = slotPositions(found.pos, found.node);
        const positions = [titlePos + 1, descriptionPos + 1];
        found.node.child(2).forEach((_action, offset) => {
            positions.push(actionsPos + offset + 2);
        });

        const index = positions.indexOf($from.start());
        if (index === -1) return false;

        const target = positions[index + direction];
        if (target === undefined) {
            return direction === 1 ? exitHeaderForward(state, dispatch) : false;
        }

        dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, target)).scrollIntoView());
        return true;
    };
}

export const nextHeaderSlot = moveHeaderSlot(1);
export const previousHeaderSlot = moveHeaderSlot(-1);

/** Backspace removes an empty header and leaves filled headers intact. */
export const unwrapHeader: Command = (state, dispatch) => {
    const {$from, empty} = state.selection;
    if (!empty || $from.parentOffset !== 0) return false;
    if ($from.parent.type !== headerTitleType(state.schema)) return false;

    const found = findHeader(state);
    if (!found) return false;
    if (found.node.textContent || found.node.attrs.image || found.node.child(2).childCount) {
        return true;
    }

    const {paragraph} = state.schema.nodes;
    if (!paragraph) return false;

    if (dispatch) {
        const tr = state.tr.replaceWith(
            found.pos,
            found.pos + found.node.nodeSize,
            paragraph.create(),
        );
        dispatch(tr.setSelection(TextSelection.create(tr.doc, found.pos + 1)));
    }
    return true;
};

/** Backspace removes an empty action without merging its container. */
export const removeEmptyAction: Command = (state, dispatch) => {
    const {$from, empty} = state.selection;
    if (!empty || $from.parentOffset !== 0) return false;
    if ($from.parent.type !== headerActionType(state.schema)) return false;
    if (!isNodeEmpty($from.parent)) return false;
    if ($from.node($from.depth - 1).type !== headerActionsType(state.schema)) return false;

    return removeHeaderActionAt($from.before($from.depth))(state, dispatch);
};
