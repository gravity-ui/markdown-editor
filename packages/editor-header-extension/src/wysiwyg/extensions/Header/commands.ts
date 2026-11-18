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

import {i18n} from '../../../i18n';
import {headerTitleNodeType} from '../HeaderTitle/HeaderTitleSpecs';
import {removeChild} from '../commands';

import {headerNodeType} from './HeaderSpecs';
import {type FoundNode, type HeaderPart, findParts, headerPartOrder, lastPartBefore} from './utils';

function headerAt(state: EditorState, pos: number) {
    const node = state.doc.nodeAt(pos);
    return node?.type === headerNodeType(state.schema) ? node : null;
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

const partNodes: Record<HeaderPart, (schema: Schema) => Node | undefined> = {
    title: (schema) =>
        headerTitleNodeType(schema)?.create(null, schema.text(i18n('preview-title'))),
};

function partFromParagraph(part: HeaderPart, paragraph: Node): Node | undefined {
    const {schema} = paragraph.type;
    if (!paragraph.childCount) return undefined;
    let plain = part === 'title';
    paragraph.forEach((child) => {
        plain &&= child.isText;
    });
    return plain
        ? headerTitleNodeType(schema)?.create(null, schema.text(paragraph.textContent))
        : undefined;
}

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

function keepSelection(tr: Transaction, pos: number) {
    const header = tr.doc.nodeAt(pos);
    const {from, to} = tr.selection;
    if (header && (from <= pos || to >= pos + header.nodeSize)) {
        tr.setSelection(NodeSelection.create(tr.doc, pos));
    }
    return closeHistory(tr);
}

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
            const only = restored ? null : onlyParagraph(header);
            const adopted = only && partFromParagraph(part, only);
            const node = restored ?? partNodes[part](state.schema);
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
