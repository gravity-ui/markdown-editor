import {DataTransferType, tryCatch} from '@gravity-ui/markdown-editor';
import {type ExtensionDeps, trackTransactionMetrics} from '@gravity-ui/markdown-editor/core';
import {
    Fragment,
    type Mark,
    type ResolvedPos,
    type Schema,
    Slice,
} from '@gravity-ui/markdown-editor/pm/model';
import {type EditorState, Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {headerTitleNodeType} from '../../../HeaderTitle/HeaderTitleSpecs';
import {
    type PasteTarget,
    draggedRange,
    dropLine,
    dropTarget,
    innerSlice,
    lineText,
    markupSlice,
    pasteLine,
    trackDrop,
} from '../../../pasteTarget';

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

function titlePasteSlice(schema: Schema, {$from}: PasteTarget, slice: Slice): Slice {
    if (slice.content.size === 0 || $from.parent.type !== headerTitleNodeType(schema)) {
        return slice;
    }
    const {content} = slice;
    const single =
        content.childCount === 1 &&
        (content.firstChild?.isInline || (slice.openStart === 1 && slice.openEnd === 1));
    if (single && onlyText(content)) return slice;
    const text = lineText(content);
    return text ? new Slice(Fragment.from(schema.text(text)), 0, 0) : Slice.empty;
}

const isTitle = ($pos: ResolvedPos) =>
    $pos.parent.type === headerTitleNodeType($pos.doc.type.schema);

const inTitle = ({selection}: EditorState) => isTitle(selection.$from);

const rangeCutsTitle = ({$from, $to}: PasteTarget) =>
    (isTitle($from) || isTitle($to)) && !$from.sameParent($to);

export const headerTitlePastePlugin = ({textParser}: ExtensionDeps) =>
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

export const headerPastePlugin = ({markupParser}: ExtensionDeps) =>
    new Plugin({
        props: {
            transformPasted: (slice, view) => {
                const $drop = dropTarget(view);
                const {schema, selection} = view.state;
                if (!$drop) return titlePasteSlice(schema, selection, slice);
                return isTitle($drop) ? dropLine(schema, innerSlice(slice)) : slice;
            },
            handleDrop: (view, _event, slice) => {
                const $drop = dropTarget(view);
                return Boolean($drop && isTitle($drop) && !slice.size);
            },
            handleDOMEvents: {
                drop(view, event) {
                    const dragged = draggedRange(view);
                    if (!dragged || !rangeCutsTitle(dragged)) return trackDrop(view, event);
                    event.preventDefault();
                    return true;
                },
                paste(view, event) {
                    const data = event.clipboardData;
                    const {state} = view;
                    if (!data?.types.includes(DataTransferType.Yfm) || insideCode(state)) {
                        return false;
                    }
                    if (!inTitle(state)) return false;
                    const res = tryCatch(() =>
                        markupParser.parse(data.getData(DataTransferType.Yfm)),
                    );
                    if (!res.success) return false;
                    const parsed = markupSlice(res.result.content);
                    const slice = titlePasteSlice(state.schema, state.selection, parsed);
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
