import type {Node} from '#pm/model';
import {type Command, type EditorState, NodeSelection, TextSelection} from '#pm/state';
import {isNodeEmpty} from 'src/utils/nodes';

import {
    type HeaderActionAttrs,
    type HeaderAttrs,
    MAX_HEADER_ACTIONS,
    headerActionType,
    headerActionsType,
    headerDescriptionType,
    headerTitleType,
    headerType,
} from './HeaderSpecs';

export type FoundHeader = {pos: number; node: Node};

/** Header, внутри которого стоит курсор, либо выделенный целиком. */
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

/**
 * Позиция приходит из тулбара и может устареть — после удаления блока или правки соседа она
 * укажет за пределы документа, а `doc.nodeAt` на таком значении бросает.
 */
function headerAt(state: EditorState, pos: number): Node | null {
    if (pos < 0 || pos >= state.doc.content.size) return null;
    const node = state.doc.nodeAt(pos);
    return node?.type === headerType(state.schema) ? node : null;
}

/** Слоты жёстко заданы схемой: title, description, actions. */
function slotPositions(headerPos: number, header: Node) {
    const titlePos = headerPos + 1;
    const descriptionPos = titlePos + header.child(0).nodeSize;
    const actionsPos = descriptionPos + header.child(1).nodeSize;
    return {titlePos, descriptionPos, actionsPos};
}

/**
 * Патч применяется поверх ноды, прочитанной из документа по позиции, а не поверх снапшота из
 * замыкания: два изменения подряд (например `bg` и `image` при загрузке картинки) иначе затирают
 * друг друга, потому что React отдаёт компоненту ноду на момент прошлого рендера.
 */
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

/** Кнопка, внутри которой стоит курсор: тип правится у неё, а не у блока целиком. */
export function findHeaderAction(state: EditorState): FoundHeader | null {
    const type = headerActionType(state.schema);
    const {$from} = state.selection;

    for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type === type) return {pos: $from.before(depth), node};
    }
    return null;
}

export const setHeaderActionType =
    (value: HeaderActionAttrs['type']): Command =>
    (state, dispatch) => {
        const found = findHeaderAction(state);
        if (!found || found.node.attrs.type === value) return false;

        dispatch?.(state.tr.setNodeMarkup(found.pos, null, {...found.node.attrs, type: value}));
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

        dispatch?.(state.tr.delete(from, from + actions.child(index).nodeSize));
        return true;
    };

/**
 * Вставляет hero-блок. Непустой параграф не заменяется, а получает блок следом — иначе набранный
 * текст молча исчезает, как это происходило в прототипе.
 */
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

/** Ставит курсор в параграф после блока, создавая его при необходимости. */
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

/** Enter в однострочных слотах не разрывает их, а переводит курсор дальше по блоку. */
export const nextHeaderSlot: Command = (state, dispatch) => {
    const {$from, empty} = state.selection;
    if (!empty) return false;

    const parentType = $from.parent.type;
    const isTitle = parentType === headerTitleType(state.schema);
    const isDescription = parentType === headerDescriptionType(state.schema);
    const isAction = parentType === headerActionType(state.schema);
    if (!isTitle && !isDescription && !isAction) return false;

    const found = findHeader(state);
    if (!found) return false;

    if (isTitle) {
        const {descriptionPos} = slotPositions(found.pos, found.node);
        dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, descriptionPos + 1)));
        return true;
    }

    if (isDescription && found.node.child(2).childCount) {
        const {actionsPos} = slotPositions(found.pos, found.node);
        dispatch?.(state.tr.setSelection(TextSelection.create(state.doc, actionsPos + 2)));
        return true;
    }

    return exitHeaderForward(state, dispatch);
};

/**
 * Backspace в начале заголовка разворачивает hero обратно в абзацы: пользователь не должен
 * терять набранный текст ради того, чтобы избавиться от блока.
 */
export const unwrapHeader: Command = (state, dispatch) => {
    const {$from, empty} = state.selection;
    if (!empty || $from.parentOffset !== 0) return false;
    if ($from.parent.type !== headerTitleType(state.schema)) return false;

    const found = findHeader(state);
    if (!found) return false;

    const {paragraph} = state.schema.nodes;
    if (!paragraph) return false;

    if (dispatch) {
        const kept = [found.node.child(0), found.node.child(1)]
            .filter((slot) => !isNodeEmpty(slot))
            .map((slot) => paragraph.create(null, slot.content));

        const tr = state.tr.replaceWith(
            found.pos,
            found.pos + found.node.nodeSize,
            kept.length ? kept : paragraph.create(),
        );
        dispatch(tr.setSelection(TextSelection.create(tr.doc, found.pos + 1)));
    }
    return true;
};

/** Backspace в пустой кнопке убирает кнопку целиком, а не расклеивает контейнер. */
export const removeEmptyAction: Command = (state, dispatch) => {
    const {$from, empty} = state.selection;
    if (!empty || $from.parentOffset !== 0) return false;
    if ($from.parent.type !== headerActionType(state.schema)) return false;
    if (!isNodeEmpty($from.parent)) return false;
    if ($from.node($from.depth - 1).type !== headerActionsType(state.schema)) return false;

    if (dispatch) {
        const from = $from.before($from.depth);
        const tr = state.tr.delete(from, from + $from.parent.nodeSize);
        dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(from - 1, 0)), -1)));
    }
    return true;
};
