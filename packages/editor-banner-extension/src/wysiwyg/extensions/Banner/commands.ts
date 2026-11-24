import {get$Cursor, pType, removeNode} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {type Command, type EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {
    type BannerBackground,
    type BannerDimensions,
    bannerBackground,
} from '@gravity-ui/markdown-plugin-banner';

import {dropBannerUploads, hasBannerUploads} from '../../plugins/BannerUploadPlugin';
import {changedAttrs} from '../attrs';

import {bannerNodeType} from './BannerSpecs';

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
