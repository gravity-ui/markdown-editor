import {get$Cursor, pType, removeNode} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import {Fragment, type Node, type Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    NodeSelection,
    TextSelection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import {
    type BannerBackground,
    type BannerDimensions,
    type BannerLayout,
    bannerBackground,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../i18n';
import {dropNodeUploads, hasNodeUploads} from '../../plugins/NodeUploadPlugin';
import {changedAttrs} from '../../utils/attrs';
import {removeChild, stopAtBlockEdge} from '../../utils/commands';
import {bannerContentNodeType} from '../BannerContent/BannerContentSpecs';
import {bannerImageNodeType} from '../BannerImage/BannerImageSpecs';
import {bannerTitleNodeType} from '../BannerTitle/BannerTitleSpecs';
import {ButtonNodeAttr, isButtonRow} from '../Button/ButtonSpecs';
import {buttonNode} from '../Button/commands';

import {bannerNodeType} from './BannerSpecs';
import {bannerButtonStyles, bannerButtonsMax} from './const';
import {
    type BannerPart,
    type FoundNode,
    type FoundParts,
    bannerPartOrder,
    findAllParts,
    findParts,
    lastPartBefore,
} from './utils';

function bannerAt(state: EditorState, pos: number) {
    const node = state.doc.nodeAt(pos);
    return node?.type === bannerNodeType(state.schema) ? node : null;
}

type BannerEdit = (edit: {
    state: EditorState;
    tr: Transaction;
    banner: Node;
    parts: FoundParts;
}) => boolean;

const bannerCommand =
    (pos: number, edit: BannerEdit): Command =>
    (state, dispatch) => {
        const banner = bannerAt(state, pos);
        if (!banner) return false;
        const tr = state.tr;
        if (!edit({state, tr, banner, parts: findParts(banner, pos)})) return false;
        dispatch?.(keepSelection(tr, pos));
        return true;
    };

const partNodes: Record<BannerPart, (schema: Schema) => Node | undefined> = {
    image: (schema) => bannerImageNodeType(schema)?.create(),
    title: (schema) =>
        bannerTitleNodeType(schema)?.create(null, schema.text(i18n('preview-title'))),
    content: (schema) =>
        bannerContentNodeType(schema)?.create(
            null,
            pType(schema).create(null, schema.text(i18n('preview-description'))),
        ),
};

function partFromParagraph(part: BannerPart, paragraph: Node): Node | undefined {
    const {schema} = paragraph.type;
    if (!paragraph.childCount || isButtonRow(paragraph)) return undefined;
    if (part === 'content') return bannerContentNodeType(schema)?.create(null, paragraph);
    let plain = part === 'title';
    paragraph.forEach((child) => {
        plain &&= child.isText;
    });
    return plain
        ? bannerTitleNodeType(schema)?.create(null, schema.text(paragraph.textContent))
        : undefined;
}

const bannerButton = (schema: Schema, index: number) =>
    buttonNode(schema, {
        ...bannerButtonStyles[index],
        [ButtonNodeAttr.Label]: i18n('button-placeholder'),
    });

function bannerNode(schema: Schema): Node {
    const type = bannerNodeType(schema);
    const button = bannerButton(schema, 0);
    const content = [
        partNodes.title(schema),
        partNodes.content(schema),
        button && pType(schema).create(null, button),
    ].filter((node): node is Node => Boolean(node));
    return type.create(null, content.length ? content : pType(schema).create());
}

const endOf = ({node, pos}: FoundNode) => pos + node.nodeSize;

function onlyParagraph(banner: Node) {
    const only = banner.childCount === 1 ? banner.firstChild : null;
    return only?.type === pType(banner.type.schema) ? only : null;
}

function insertChild(
    tr: Transaction,
    banner: Node,
    pos: number,
    at: number,
    node: Node | Fragment,
) {
    const only = onlyParagraph(banner);
    if (only?.childCount === 0) {
        tr.replaceWith(pos + 1, pos + 1 + only.nodeSize, node);
    } else {
        tr.insert(at, node);
    }
}

function keepSelection(tr: Transaction, pos: number) {
    const banner = tr.doc.nodeAt(pos);
    const {from, to} = tr.selection;
    if (banner && (from <= pos || to >= pos + banner.nodeSize)) {
        tr.setSelection(NodeSelection.create(tr.doc, pos));
    }
    return closeHistory(tr);
}

const stopAtBannerEdge = stopAtBlockEdge(bannerNodeType);

export const stopAtBannerStart = stopAtBannerEdge(-1);
export const stopAtBannerEnd = stopAtBannerEdge(1);

export const liftEmptyBlockFromBanner: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);
    if (!$cursor || $cursor.depth < 2 || $cursor.parent.content.size) return false;
    if ($cursor.parent.type !== pType(state.schema)) return false;
    const banner = $cursor.node(-1);
    if (banner.type !== bannerNodeType(state.schema) || banner.childCount < 2) return false;
    if ($cursor.after() !== $cursor.end(-1)) return false;
    if (dispatch) {
        const range = $cursor.blockRange();
        if (range) dispatch(state.tr.lift(range, $cursor.depth - 2).scrollIntoView());
    }
    return true;
};

export const insertBanner: Command = (state, dispatch) => {
    const $cursor = get$Cursor(state.selection);
    if ($cursor?.parent.type !== pType(state.schema)) return false;
    const type = bannerNodeType(state.schema);
    for (let depth = $cursor.depth - 1; depth > 0; depth--) {
        if ($cursor.node(depth).type === type) return false;
    }
    if (dispatch) {
        const tr = state.tr.replaceSelectionWith(bannerNode(state.schema));
        let start = 0;
        tr.mapping.maps[tr.mapping.maps.length - 1].forEach((_from, _to, newFrom) => {
            start = newFrom;
        });
        const $start = tr.doc.resolve(start);
        const bannerPos = $start.nodeAfter?.type === type ? start : $start.after();
        const first = tr.doc.nodeAt(bannerPos + 1);
        const from = bannerPos + 2;
        const to = from + (first?.isTextblock ? first.content.size : 0);
        dispatch(tr.setSelection(TextSelection.create(tr.doc, from, to)).scrollIntoView());
    }
    return true;
};

const setBannerAttr =
    (pos: number, name: string, value: unknown): Command =>
    (state, dispatch) => {
        const node = bannerAt(state, pos);
        if (!node) return false;
        if (dispatch && node.attrs[name] !== value) {
            dispatch(state.tr.setNodeAttribute(pos, name, value));
        }
        return true;
    };

export const setBannerDimension = <K extends keyof BannerDimensions>(
    pos: number,
    name: K,
    value: BannerDimensions[K],
) => setBannerAttr(pos, name, value);

export const setBannerLayout = <K extends keyof BannerLayout>(
    pos: number,
    name: K,
    value: BannerLayout[K],
) => setBannerAttr(pos, name, value);

/** Attributes that set the source of the background; a change of either drops a pending upload. */
export const bannerBackgroundSources = ['bg-image', 'bg-color'] as const;

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
            const changesSource = bannerBackgroundSources.some((name) => name in background);
            const cancelsUpload = changesSource && hasNodeUploads(state, pos);
            if (cancelsUpload) dropNodeUploads(tr, pos);
            if (tr.docChanged) {
                dispatch(closeHistory(tr));
            } else if (cancelsUpload) {
                dispatch(tr);
            }
        }
        return true;
    };

export const setBannerPart = (
    pos: number,
    part: BannerPart,
    enabled: boolean,
    restored?: readonly Node[],
): Command =>
    bannerCommand(pos, ({state, tr, banner, parts}) => {
        if (Boolean(parts[part]) === enabled) return false;
        if (!enabled) {
            const found = findAllParts(banner, pos, part);
            if (found.length === banner.childCount) {
                tr.replaceWith(pos + 1, pos + banner.nodeSize - 1, pType(state.schema).create());
            } else {
                for (const {node, pos: from} of found.reverse()) {
                    tr.delete(from, from + node.nodeSize);
                }
            }
            return true;
        }
        const only = onlyParagraph(banner);
        const adopted = !restored?.length && only && partFromParagraph(part, only);
        if (adopted) {
            tr.replaceWith(pos + 1, pos + banner.nodeSize - 1, adopted);
            return true;
        }
        const node = restored?.length ? Fragment.from(restored) : partNodes[part](state.schema);
        if (!node) return false;
        const before = lastPartBefore(parts, bannerPartOrder.indexOf(part));
        insertChild(tr, banner, pos, before ? endOf(before) : pos + 1, node);
        return true;
    });

export type RemovedParts = Map<BannerPart, readonly Node[]>;

export const toggleBannerPart =
    (pos: number, part: BannerPart, enabled: boolean, removed: RemovedParts): Command =>
    (state, dispatch, view) => {
        const banner = bannerAt(state, pos);
        if (!banner) return false;
        const found = findAllParts(banner, pos, part).map(({node}) => node);
        if (!setBannerPart(pos, part, enabled, removed.get(part))(state, dispatch, view)) {
            return false;
        }
        if (dispatch) {
            if (enabled) removed.delete(part);
            else removed.set(part, found);
        }
        return true;
    };

export const addBannerButton = (pos: number): Command =>
    bannerCommand(pos, ({state, tr, banner, parts}) => {
        const {buttons} = parts;
        if (buttons.length >= bannerButtonsMax) return false;
        const last = buttons[buttons.length - 1];
        const button = bannerButton(state.schema, buttons.length);
        if (!button) return false;
        if (last) {
            tr.insert(endOf(last.row) - 1, button);
            return true;
        }
        const before = lastPartBefore(parts);
        const row = pType(state.schema).create(null, button);
        insertChild(tr, banner, pos, before ? endOf(before) : pos + 1, row);
        return true;
    });

export const removeBannerButton = (pos: number, index: number): Command =>
    bannerCommand(pos, ({tr, banner, parts: {buttons}}) => {
        const button = buttons[index];
        if (!button) return false;
        if (buttons.some((item) => item !== button && item.row.pos === button.row.pos)) {
            tr.delete(button.pos, endOf(button));
        } else {
            removeChild(tr, banner, button.row);
        }
        return true;
    });

export const removeBanner =
    (pos: number): Command =>
    (state, dispatch) => {
        const node = bannerAt(state, pos);
        if (!node) return false;
        if (dispatch) removeNode({node, pos, tr: state.tr, dispatch});
        return true;
    };
