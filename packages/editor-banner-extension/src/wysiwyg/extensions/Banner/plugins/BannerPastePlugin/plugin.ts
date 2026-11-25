import {DataTransferType, pType, tryCatch} from '@gravity-ui/markdown-editor';
import {type ExtensionDeps, trackTransactionMetrics} from '@gravity-ui/markdown-editor/core';
import {
    Fragment,
    type Mark,
    type Node,
    type ResolvedPos,
    type Schema,
    Slice,
} from '@gravity-ui/markdown-editor/pm/model';
import {type EditorState, Plugin} from '@gravity-ui/markdown-editor/pm/state';
import {findParentNodeOfTypeClosestToPos} from '@gravity-ui/markdown-editor/pm/utils';

import {type PasteTarget, lineText, markupSlice, pasteLine} from '../../../../utils/pasteTarget';
import {bannerContentNodeType} from '../../../BannerContent/BannerContentSpecs';
import {bannerTitleNodeType} from '../../../BannerTitle/BannerTitleSpecs';
import {bannerNodeType} from '../../BannerSpecs';

function bannerPartsBlocks(
    schema: Schema,
    fragment: Fragment,
    openStart: number,
    openEnd: number,
    inBanner: boolean,
): Node[] | null {
    const blocks: Node[] = [];
    let changed = false;
    fragment.forEach((node, _offset, index) => {
        const start = index === 0 ? openStart : 0;
        const end = index === fragment.childCount - 1 ? openEnd : 0;
        if (node.type === bannerTitleNodeType(schema)) {
            blocks.push(pType(schema).create(null, node.content));
            changed = true;
        } else if (
            node.type === bannerContentNodeType(schema) ||
            (node.type === bannerNodeType(schema) && (inBanner || start > 0 || end > 0))
        ) {
            const inner = bannerPartsBlocks(
                schema,
                node.content,
                Math.max(start - 1, 0),
                Math.max(end - 1, 0),
                inBanner,
            );
            if (inner) blocks.push(...inner);
            else node.content.forEach((child) => blocks.push(child));
            changed = true;
        } else {
            blocks.push(node);
        }
    });
    return changed ? blocks : null;
}

function onlyText(fragment: Fragment) {
    let text = true;
    fragment.descendants((node) => {
        if (node.isLeaf && !node.isText) text = false;
        return text;
    });
    return text;
}

const isCodeMark = (mark: Mark) => Boolean(mark.type.spec.code);

function insideCode({selection, storedMarks}: EditorState) {
    const {$from, empty} = selection;
    return (
        Boolean($from.parent.type.spec.code) ||
        $from.marks().some(isCodeMark) ||
        (empty && (storedMarks ?? []).some(isCodeMark))
    );
}

function bannerPasteSlice(schema: Schema, {$from}: PasteTarget, slice: Slice): Slice {
    if (slice.content.size === 0) return slice;
    if ($from.parent.type === bannerTitleNodeType(schema)) {
        const {content} = slice;
        const single =
            content.childCount === 1 &&
            (content.firstChild?.isInline || (slice.openStart === 1 && slice.openEnd === 1));
        if (single && onlyText(content)) return slice;
        const text = lineText(content);
        return text ? new Slice(Fragment.from(schema.text(text)), 0, 0) : Slice.empty;
    }
    const inBanner = Boolean(findParentNodeOfTypeClosestToPos($from, bannerNodeType(schema)));
    const blocks = bannerPartsBlocks(
        schema,
        slice.content,
        slice.openStart,
        slice.openEnd,
        inBanner,
    );
    if (!blocks?.length) return slice;
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    return new Slice(
        Fragment.from(blocks),
        first.isTextblock && slice.openStart > 0 ? 1 : 0,
        last.isTextblock && slice.openEnd > 0 ? 1 : 0,
    );
}

const bannerPartDirective = /::(banner-title|banner-content)/;

const isTitle = ($pos: ResolvedPos) =>
    $pos.parent.type === bannerTitleNodeType($pos.doc.type.schema);

const inTitle = ({selection}: EditorState) => isTitle(selection.$from);

export const bannerTitlePastePlugin = ({textParser}: ExtensionDeps) =>
    new Plugin({
        props: {
            handleDOMEvents: {
                paste(view, event) {
                    const data = event.clipboardData;
                    if (!data || !inTitle(view.state) || !pasteLine(view, data, textParser)) {
                        return false;
                    }
                    event.preventDefault();
                    return true;
                },
            },
        },
    });

export const bannerPastePlugin = ({markupParser}: ExtensionDeps) =>
    new Plugin({
        props: {
            transformPasted: (slice, view) =>
                bannerPasteSlice(view.state.schema, view.state.selection, slice),
            handleDOMEvents: {
                paste(view, event) {
                    const data = event.clipboardData;
                    const {state} = view;
                    if (!data?.types.includes(DataTransferType.Yfm) || insideCode(state)) {
                        return false;
                    }
                    const markup = data.getData(DataTransferType.Yfm);
                    if (!inTitle(state) && !bannerPartDirective.test(markup)) return false;
                    const res = tryCatch(() => markupParser.parse(markup));
                    if (!res.success) return false;
                    const parsed = markupSlice(res.result.content);
                    const slice = bannerPasteSlice(state.schema, state.selection, parsed);
                    if (slice === parsed) return false;
                    event.preventDefault();
                    view.dispatch(
                        trackTransactionMetrics(
                            state.tr.replaceSelection(slice).scrollIntoView(),
                            'paste',
                            {clipboardDataFormat: DataTransferType.Yfm},
                        ),
                    );
                    return true;
                },
            },
        },
    });
