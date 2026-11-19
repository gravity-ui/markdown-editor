import {get$Cursor, pType, removeNode} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    NodeSelection,
    TextSelection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import {
    type HeaderBackground,
    type HeaderDimensions,
    headerBackground,
} from '@gravity-ui/markdown-plugin-header';

import {dropHeaderUploads} from '../../plugins/HeaderUploadPlugin';
import {changedAttrs} from '../attrs';
import {removeChild} from '../commands';

import {headerNodeType} from './HeaderSpecs';
import {
    type FoundNode,
    type HeaderPart,
    findParts,
    headerPartOrder,
    headerPartSpec,
    headerPartTypes,
    lastPartBefore,
} from './parts';
import {headerAt} from './utils';

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
        const node = headerAt(state, pos);
        if (!node) return false;
        if (dispatch && changedAttrs(node.attrs, {[name]: value}).length) {
            dispatch(state.tr.setNodeAttribute(pos, name, value));
        }
        return true;
    };

/**
 * Changes the background attributes in one undo step; the theme and the blur are reset without an image.
 * A new source of the background drops the uploads into the banner, even when the attributes stay the same.
 */
export const setHeaderBackground =
    (pos: number, background: Partial<HeaderBackground>): Command =>
    (state, dispatch) => {
        const node = headerAt(state, pos);
        if (!node) return false;
        if (dispatch) {
            const next = headerBackground({...headerBackground(node.attrs), ...background});
            const tr = state.tr;
            for (const [name, value] of changedAttrs(node.attrs, next)) {
                tr.setNodeAttribute(pos, name, value);
            }
            const changesSource = 'bg-image' in background || 'bg-color' in background;
            if (changesSource) dropHeaderUploads(tr, pos);
            if (tr.docChanged || changesSource) dispatch(closeHistory(tr));
        }
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

const endOf = ({node, pos}: FoundNode) => pos + node.nodeSize;

function onlyParagraph(header: Node) {
    const only = header.childCount === 1 ? header.firstChild : null;
    return only?.type === pType(header.type.schema) ? only : null;
}

function insertChild(tr: Transaction, header: Node, pos: number, at: number, node: Node) {
    const only = onlyParagraph(header);
    if (only?.childCount === 0) {
        tr.replaceWith(pos + 1, pos + 1 + only.nodeSize, node);
    } else {
        tr.insert(at, node);
    }
}

/** A selection that was around the changed blocks becomes the banner; each switch is one undo step. */
function keepSelection(tr: Transaction, pos: number) {
    const header = tr.doc.nodeAt(pos);
    const {from, to} = tr.selection;
    if (header && (from <= pos || to >= pos + header.nodeSize)) {
        tr.setSelection(NodeSelection.create(tr.doc, pos));
    }
    return closeHistory(tr);
}

/**
 * Inserts or removes the block of a part in the banner at `pos`.
 * A new block goes after the parts before it in `headerPartOrder`; `restored` is inserted instead of a new one.
 */
export const setHeaderPart =
    (pos: number, part: HeaderPart, enabled: boolean, restored?: Node): Command =>
    (state, dispatch) => {
        const header = headerAt(state, pos);
        if (!header) return false;
        const parts = findParts(header, pos);
        const found = parts[part];
        if (Boolean(found) === enabled) return false;
        const tr = state.tr;
        if (found) {
            removeChild(tr, header, found);
        } else {
            const type = headerPartTypes(state.schema)[part];
            const spec = type && headerPartSpec(type);
            if (!type || !spec) return false;
            const only = restored ? null : onlyParagraph(header);
            const adopted = only?.childCount ? spec.adopt?.(only, type) : null;
            const node = restored ?? spec.create(type);
            if (adopted) {
                tr.replaceWith(pos + 1, pos + header.nodeSize - 1, adopted);
            } else if (node) {
                const before = lastPartBefore(parts, headerPartOrder.indexOf(part));
                insertChild(tr, header, pos, before ? endOf(before) : pos + 1, node);
            } else {
                return false;
            }
        }
        dispatch?.(keepSelection(tr, pos));
        return true;
    };

export type RemovedParts = Map<HeaderPart, Node>;

/** Keeps a removed part in `removed` and inserts it back when the part is enabled again. */
export const toggleHeaderPart =
    (pos: number, part: HeaderPart, enabled: boolean, removed: RemovedParts): Command =>
    (state, dispatch, view) => {
        const header = headerAt(state, pos);
        if (!header) return false;
        const found = findParts(header, pos)[part];
        if (!setHeaderPart(pos, part, enabled, removed.get(part))(state, dispatch, view)) {
            return false;
        }
        if (dispatch && found) removed.set(part, found.node);
        return true;
    };
