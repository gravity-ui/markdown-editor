import {get$Cursor, pType, removeNode} from '@gravity-ui/markdown-editor';
import {type Command, type EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {
    type BannerBackground,
    type BannerDimensions,
    bannerBackground,
} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeType} from './BannerSpecs';
import {type UploadMeta, uploadsKey} from './plugins/BannerUploadPlugin/const';

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
        if (!bannerAt(state, pos)) return false;
        dispatch?.(state.tr.setNodeAttribute(pos, name, value));
        return true;
    };

/** Changes background attributes in one undo step; the theme and the blur are reset without an image. */
export const setBannerBackground =
    (pos: number, background: Partial<BannerBackground>): Command =>
    (state, dispatch) => {
        const node = bannerAt(state, pos);
        if (!node) return false;
        if (dispatch) {
            const next = bannerBackground({...bannerBackground(node.attrs), ...background});
            const tr = state.tr;
            for (const [name, value] of Object.entries(next)) {
                if (node.attrs[name] !== value) tr.setNodeAttribute(pos, name, value);
            }
            // A source choice supersedes uploads even when it leaves the attributes unchanged.
            const changesSource = 'bg-image' in background || 'bg-color' in background;
            if (changesSource) tr.setMeta(uploadsKey, {pos} satisfies UploadMeta);
            if (tr.docChanged || changesSource) dispatch(tr);
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
