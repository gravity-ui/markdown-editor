import {pType} from '@gravity-ui/markdown-editor';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, type EditorState, TextSelection} from '@gravity-ui/markdown-editor/pm/state';
import {
    type SectionBackground,
    type SectionSettings,
    equalColumnSizes,
    sectionMaxColumns,
} from '@gravity-ui/markdown-plugin-section';

import {sectionColumnNodeType, sectionNodeType} from './SectionSpecs';

export const insertSection: Command = (state, dispatch) => {
    const {schema, selection} = state;
    const type = sectionNodeType(schema);
    const $to = selection.$to;
    const pos = $to.depth === 0 ? $to.pos : $to.after(1);
    const replaceEmpty =
        selection.empty &&
        $to.depth === 1 &&
        $to.parent.type === pType(schema) &&
        !$to.parent.content.size;
    const start = replaceEmpty ? $to.before(1) : pos;
    const $start = state.doc.resolve(start);
    const index = $start.index();
    if (!state.doc.canReplaceWith(index, index + Number(replaceEmpty), type)) return false;
    if (dispatch) {
        const column = sectionColumnNodeType(schema);
        const columns = equalColumnSizes(3).map((size) =>
            column.createChecked({size}, pType(schema).create()),
        );
        const tr = state.tr.replaceWith(start, pos, type.createChecked(null, columns));
        dispatch(tr.setSelection(TextSelection.create(tr.doc, start + 3)).scrollIntoView());
    }
    return true;
};

export function canSetSectionColumns(node: Node, count: number): boolean {
    if (!Number.isInteger(count) || count < 1 || count > sectionMaxColumns) return false;
    for (let index = count; index < node.childCount; index++) {
        const column = node.child(index);
        if (
            column.childCount !== 1 ||
            column.firstChild?.type !== pType(node.type.schema) ||
            column.firstChild.content.size > 0
        ) {
            return false;
        }
    }
    return true;
}

export const setSectionColumns =
    (pos: number, count: number): Command =>
    (state, dispatch) => {
        const node = sectionAt(state, pos);
        if (!node || count === node.childCount || !canSetSectionColumns(node, count)) return false;
        if (dispatch) {
            const sizes = equalColumnSizes(count);
            const tr = state.tr;
            const end = pos + node.nodeSize - 1;
            let removeFrom = end;
            node.forEach((_column, offset, index) => {
                const columnPos = pos + 1 + offset;
                if (index < count) {
                    tr.setNodeAttribute(columnPos, 'size', sizes[index]);
                } else if (index === count) {
                    removeFrom = columnPos;
                }
            });
            if (count > node.childCount) {
                const column = sectionColumnNodeType(state.schema);
                tr.insert(
                    end,
                    sizes
                        .slice(node.childCount)
                        .map((size) => column.createChecked({size}, pType(state.schema).create())),
                );
            } else {
                tr.delete(removeFrom, end);
            }
            dispatch(tr);
        }
        return true;
    };

export const setSectionSetting =
    <K extends keyof SectionSettings>(pos: number, key: K, value: SectionSettings[K]): Command =>
    (state, dispatch) => {
        const node = sectionAt(state, pos);
        if (!node || node.attrs[key] === value) return false;
        dispatch?.(state.tr.setNodeAttribute(pos, key, value));
        return true;
    };

export const setSectionColumnBackground =
    (pos: number, index: number, background: SectionBackground): Command =>
    (state, dispatch) => {
        const node = sectionAt(state, pos);
        const column = node?.maybeChild(index);
        if (!node || !column || column.attrs.background === background) return false;
        dispatch?.(
            state.tr.setNodeAttribute(
                pos + 1 + columnOffset(node, index),
                'background',
                background,
            ),
        );
        return true;
    };

export const resizeSectionColumns =
    (pos: number, index: number, sizes: [number, number], previous: [number, number]): Command =>
    (state, dispatch) => {
        const node = sectionAt(state, pos);
        const first = node?.maybeChild(index);
        const second = node?.maybeChild(index + 1);
        if (
            !node ||
            !first ||
            !second ||
            first.attrs.size !== previous[0] ||
            second.attrs.size !== previous[1]
        )
            return false;
        if (
            sizes[0] === previous[0] ||
            sizes.some((size) => !Number.isInteger(size) || size < 1) ||
            sizes[0] + sizes[1] !== previous[0] + previous[1]
        )
            return false;
        if (dispatch) {
            const columnPos = pos + 1 + columnOffset(node, index);
            dispatch(
                closeHistory(state.tr)
                    .setNodeAttribute(columnPos, 'size', sizes[0])
                    .setNodeAttribute(columnPos + first.nodeSize, 'size', sizes[1]),
            );
        }
        return true;
    };

function sectionAt(state: EditorState, pos: number) {
    if (pos < 0 || pos >= state.doc.content.size) return null;
    const node = state.doc.nodeAt(pos);
    return node?.type === sectionNodeType(state.schema) ? node : null;
}

function columnOffset(node: Node, target: number) {
    let result = 0;
    node.forEach((_column, offset, index) => {
        if (index === target) result = offset;
    });
    return result;
}
