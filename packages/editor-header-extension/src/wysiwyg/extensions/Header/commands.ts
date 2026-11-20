import {get$Cursor, pType, removeNode} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Node, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    NodeSelection,
    TextSelection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import type {HeaderDimensions} from '@gravity-ui/markdown-plugin-header';

import {headerImageNodeType} from '../HeaderImage/HeaderImageSpecs';
import {removeChild} from '../commands';

import {headerNodeType} from './HeaderSpecs';
import {type FoundParts, type HeaderPart, findParts} from './utils';

function headerAt(state: EditorState, pos: number) {
    const node = state.doc.nodeAt(pos);
    return node?.type === headerNodeType(state.schema) ? node : null;
}

type HeaderEdit = (edit: {
    state: EditorState;
    tr: Transaction;
    header: Node;
    parts: FoundParts;
}) => boolean;

const headerCommand =
    (pos: number, edit: HeaderEdit): Command =>
    (state, dispatch) => {
        const header = headerAt(state, pos);
        if (!header) return false;
        const tr = state.tr;
        if (!edit({state, tr, header, parts: findParts(header, pos)})) return false;
        dispatch?.(keepSelection(tr, pos));
        return true;
    };

const partNodes: Record<HeaderPart, (schema: Schema) => Node | undefined> = {
    image: (schema) => headerImageNodeType(schema)?.create(),
};

function keepSelection(tr: Transaction, pos: number) {
    const header = tr.doc.nodeAt(pos);
    const {from, to} = tr.selection;
    if (header && (from <= pos || to >= pos + header.nodeSize)) {
        tr.setSelection(NodeSelection.create(tr.doc, pos));
    }
    return closeHistory(tr);
}

export const insertHeader: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);
    if ($cursor?.parent.type !== pType(state.schema)) return false;
    const type = headerNodeType(state.schema);
    for (let depth = $cursor.depth - 1; depth > 0; depth--) {
        if ($cursor.node(depth).type === type) return false;
    }
    if (dispatch) {
        const tr = state.tr.replaceSelectionWith(type.createAndFill()!);
        let start = 0;
        tr.mapping.maps[tr.mapping.maps.length - 1].forEach((_from, _to, newFrom) => {
            start = newFrom;
        });
        // A split paragraph puts the replaced range inside its first half.
        const $start = tr.doc.resolve(start);
        const headerPos = $start.nodeAfter?.type === type ? start : $start.after();
        // `+ 2` skips the opening tokens of the header and of its paragraph.
        dispatch(tr.setSelection(TextSelection.create(tr.doc, headerPos + 2)).scrollIntoView());
    }
    return true;
};

export const setHeaderDimension =
    <K extends keyof HeaderDimensions>(pos: number, name: K, value: HeaderDimensions[K]): Command =>
    (state, dispatch) => {
        if (!headerAt(state, pos)) return false;
        dispatch?.(state.tr.setNodeAttribute(pos, name, value));
        return true;
    };

export const copyHeader =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        dispatch?.(state.tr.insert(pos + node.nodeSize, node));
        return true;
    };

export const removeHeader =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        if (dispatch) removeNode({node, pos, tr: state.tr, dispatch});
        return true;
    };

/** `restored` is the removed block of the part; it is inserted instead of a new one. */
export const setHeaderPart = (
    pos: number,
    part: HeaderPart,
    enabled: boolean,
    restored?: Node,
): Command =>
    headerCommand(pos, ({state, tr, header, parts}) => {
        const found = parts[part];
        if (Boolean(found) === enabled) return false;
        if (found) {
            removeChild(tr, header, found);
            return true;
        }
        const node = restored ?? partNodes[part](state.schema);
        if (!node) return false;
        tr.insert(pos + 1, node);
        return true;
    });

export type RemovedParts = Map<HeaderPart, Node>;

/** Keeps a removed part in `removed` and inserts it back when the part is enabled again. */
export const toggleHeaderPart =
    (pos: number, part: HeaderPart, enabled: boolean, removed: RemovedParts): Command =>
    (state, dispatch, view) => {
        const header = headerAt(state, pos);
        if (!header) return false;
        const found = findParts(header, pos)[part];
        if (!setHeaderPart(pos, part, enabled, removed.get(part))(state, dispatch, view))
            return false;
        if (dispatch && found) removed.set(part, found.node);
        return true;
    };
