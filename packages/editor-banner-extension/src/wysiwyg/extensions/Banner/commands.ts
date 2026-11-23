import {DataTransferType, get$Cursor, pType, removeNode} from '@gravity-ui/markdown-editor';
import type {Serializer} from '@gravity-ui/markdown-editor/core';
import {Fragment, Slice} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, type EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import type {BannerDimensions} from '@gravity-ui/markdown-plugin-banner';

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
        if (!bannerAt(state, pos)) return false;
        dispatch?.(state.tr.setNodeAttribute(pos, name, value));
        return true;
    };

/** Clipboard formats match a copied selection: `text/yfm`, HTML, and plain text. */
export function copyBanner(view: EditorView, pos: number, serializer: Serializer): boolean {
    const node = bannerAt(view.state, pos);
    if (!node) return false;
    const markup = serializer.serialize(view.state.schema.topNodeType.create(null, node));
    const {dom, text} = view.serializeForClipboard(new Slice(Fragment.from(node), 0, 0));
    const onCopy = (event: ClipboardEvent) => {
        const data = event.clipboardData;
        if (!data) return;
        // The editor handler and the default action copy the selection instead.
        event.stopPropagation();
        event.preventDefault();
        data.setData(DataTransferType.Yfm, markup);
        data.setData(DataTransferType.Html, dom.innerHTML);
        data.setData(DataTransferType.Text, text);
    };
    const {ownerDocument} = view.dom;
    ownerDocument.addEventListener('copy', onCopy, true);
    try {
        // `navigator.clipboard.write` rejects the `text/yfm` type.
        return ownerDocument.execCommand('copy');
    } finally {
        ownerDocument.removeEventListener('copy', onCopy, true);
    }
}

export const removeBanner =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = bannerAt(state, pos);
        if (!node) return false;
        if (dispatch) removeNode({node, pos, tr: state.tr, dispatch});
        return true;
    };
