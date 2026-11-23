import {get$Cursor, pType, removeNode} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    NodeSelection,
    TextSelection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import type {NodeWithPos} from '@gravity-ui/markdown-editor/pm/utils';
import {
    type BannerBackground,
    type BannerDimensions,
    type BannerLayout,
    bannerBackground,
} from '@gravity-ui/markdown-plugin-banner';

import {dropBannerUploads, hasBannerUploads} from '../../plugins/BannerUploadPlugin';
import {changedAttrs} from '../attrs';
import {removeChild, stopAtBlockEdge} from '../commands';

import {bannerNodeType} from './BannerSpecs';
import {
    type BannerPart,
    bannerPartOrder,
    bannerPartSpec,
    bannerPartTypes,
    findParts,
    lastPartBefore,
} from './parts';

function bannerAt(state: EditorState, pos: number) {
    const node = state.doc.nodeAt(pos);
    return node?.type === bannerNodeType(state.schema) ? node : null;
}

export const insertBanner: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);
    if ($cursor?.parent.type !== pType(state.schema)) return false;
    const type = bannerNodeType(state.schema);
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
        const bannerPos = $start.nodeAfter?.type === type ? start : $start.after();
        // `+ 2` skips the opening tokens of the banner and of its paragraph.
        dispatch(tr.setSelection(TextSelection.create(tr.doc, bannerPos + 2)).scrollIntoView());
    }
    return true;
};

export const setBannerDimension =
    <K extends keyof BannerDimensions>(pos: number, name: K, value: BannerDimensions[K]): Command =>
    (state, dispatch) => {
        const node = bannerAt(state, pos);
        if (!node) return false;
        if (dispatch && changedAttrs(node.attrs, {[name]: value}).length) {
            dispatch(state.tr.setNodeAttribute(pos, name, value));
        }
        return true;
    };

/** Changes the alignment or the vertical position of the content; each change is one undo step. */
export const setBannerLayout =
    <K extends keyof BannerLayout>(pos: number, name: K, value: BannerLayout[K]): Command =>
    (state, dispatch) => {
        const node = bannerAt(state, pos);
        if (!node) return false;
        if (dispatch && changedAttrs(node.attrs, {[name]: value}).length) {
            dispatch(closeHistory(state.tr.setNodeAttribute(pos, name, value)));
        }
        return true;
    };

/**
 * Changes the background attributes in one undo step; the theme and the blur are reset without an image.
 * A new source of the background drops the uploads into the banner, even when the attributes stay the same.
 */
export const setBannerBackground =
    (pos: number, background: Partial<BannerBackground>): Command =>
    (state, dispatch) => {
        const node = bannerAt(state, pos);
        if (!node) return false;
        if (dispatch) {
            const next = bannerBackground({...bannerBackground(node.attrs), ...background});
            const tr = state.tr;
            for (const [name, value] of changedAttrs(node.attrs, next)) {
                tr.setNodeAttribute(pos, name, value);
            }
            const changesSource = 'bg-image' in background || 'bg-color' in background;
            const cancelsUpload = changesSource && hasBannerUploads(state, pos);
            if (cancelsUpload) dropBannerUploads(tr, pos);
            if (tr.docChanged) {
                dispatch(closeHistory(tr));
            } else if (cancelsUpload) {
                dispatch(tr);
            }
        }
        return true;
    };

export const removeBanner =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = bannerAt(state, pos);
        if (!node) return false;
        if (dispatch) removeNode({node, pos, tr: state.tr, dispatch});
        return true;
    };

const endOf = ({node, pos}: NodeWithPos) => pos + node.nodeSize;

function onlyParagraph(banner: Node) {
    const only = banner.childCount === 1 ? banner.firstChild : null;
    return only?.type === pType(banner.type.schema) ? only : null;
}

function insertChild(tr: Transaction, banner: Node, pos: number, at: number, node: Node) {
    const only = onlyParagraph(banner);
    if (only?.childCount === 0) {
        tr.replaceWith(pos + 1, pos + 1 + only.nodeSize, node);
    } else {
        tr.insert(at, node);
    }
}

/** A selection that was around the changed blocks becomes the banner; each switch is one undo step. */
function keepSelection(tr: Transaction, pos: number) {
    const banner = tr.doc.nodeAt(pos);
    const {from, to} = tr.selection;
    if (banner && (from <= pos || to >= pos + banner.nodeSize)) {
        tr.setSelection(NodeSelection.create(tr.doc, pos));
    }
    return closeHistory(tr);
}

/**
 * Inserts or removes the block of a part in the banner at `pos`.
 * A new block goes after the parts before it in `bannerPartOrder`; `restored` is inserted instead of a new one.
 */
export const setBannerPart =
    (pos: number, part: BannerPart, enabled: boolean, restored?: Node): Command =>
    (state, dispatch) => {
        const banner = bannerAt(state, pos);
        if (!banner) return false;
        const parts = findParts(banner, pos);
        const found = parts[part];
        if (Boolean(found) === enabled) return false;
        const tr = state.tr;
        if (found) {
            removeChild(tr, banner, found);
        } else {
            const type = bannerPartTypes(state.schema)[part];
            const spec = type && bannerPartSpec(type);
            if (!type || !spec) return false;
            const only = restored ? null : onlyParagraph(banner);
            const adopted = only?.childCount ? spec.adopt?.(only, type) : null;
            const node = restored ?? spec.create(type);
            if (adopted) {
                tr.replaceWith(pos + 1, pos + banner.nodeSize - 1, adopted);
            } else if (node) {
                const before = lastPartBefore(parts, bannerPartOrder.indexOf(part));
                insertChild(tr, banner, pos, before ? endOf(before) : pos + 1, node);
            } else {
                return false;
            }
        }
        dispatch?.(keepSelection(tr, pos));
        return true;
    };

export type RemovedParts = Map<BannerPart, Node>;

/** Keeps a removed part in `removed` and inserts it back when the part is enabled again. */
export const toggleBannerPart =
    (pos: number, part: BannerPart, enabled: boolean, removed: RemovedParts): Command =>
    (state, dispatch, view) => {
        const banner = bannerAt(state, pos);
        if (!banner) return false;
        const found = findParts(banner, pos)[part];
        if (!setBannerPart(pos, part, enabled, removed.get(part))(state, dispatch, view)) {
            return false;
        }
        if (dispatch) {
            if (found) removed.set(part, found.node);
            else removed.delete(part);
        }
        return true;
    };

const stopAtBannerEdge = stopAtBlockEdge(bannerNodeType);

export const stopAtBannerStart = stopAtBannerEdge(-1);
export const stopAtBannerEnd = stopAtBannerEdge(1);
