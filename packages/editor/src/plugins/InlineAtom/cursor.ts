import type {CodemarkState} from 'prosemirror-codemark';
import type {Node, NodeType, Schema} from 'prosemirror-model';
import {type EditorState, Plugin} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

import {get$Cursor} from '../../utils/selection';

// Styles of the fake cursor, shared with the Code extension.
import '../../extensions/markdown/Code/code.scss';

// The fake cursor of prosemirror-codemark, which the Code extension uses at the edges of inline code.
// Next to an inline atom the native caret takes the height of the atom, so the cursor is drawn the same way.
const fakeCursorClassName = 'fake-cursor';
const noCursorClassName = 'no-cursor';

/**
 * Flag of the node spec: the node draws the fake cursor at its edges.
 * Between two such nodes only the node before the cursor draws it.
 */
export const fakeCursorSpecKey = 'fakeCursor';

const hasFakeCursor = (node: Node | null | undefined) =>
    node?.type.spec[fakeCursorSpecKey] === true;

export const getInlineAtomCursorState = (state: EditorState, type: NodeType): CodemarkState => {
    const $cursor = get$Cursor(state.selection);
    if (!$cursor) return null;

    const {nodeBefore, nodeAfter} = $cursor;
    // Code owns both the inside and outside cursor at its boundary.
    if (
        nodeBefore?.marks.some((mark) => mark.type.spec.code) ||
        nodeAfter?.marks.some((mark) => mark.type.spec.code)
    )
        return null;
    if (nodeBefore?.type === type) return {active: true, side: 0};
    if (nodeAfter?.type === type && !hasFakeCursor(nodeBefore)) return {active: true, side: -1};
    return null;
};

const createFakeCursor = () => {
    const span = document.createElement('span');
    span.classList.add(fakeCursorClassName);
    return span;
};

export const inlineAtomCursorPlugin = (nodeType: (schema: Schema) => NodeType) =>
    new Plugin({
        props: {
            attributes: (state): Record<string, string> =>
                getInlineAtomCursorState(state, nodeType(state.schema))?.active
                    ? {class: noCursorClassName}
                    : {},
            decorations(state) {
                const cursor = getInlineAtomCursorState(state, nodeType(state.schema));
                if (!cursor?.active) return DecorationSet.empty;

                const widget = Decoration.widget(state.selection.from, createFakeCursor, {
                    side: cursor.side,
                    key: fakeCursorClassName,
                });
                return DecorationSet.create(state.doc, [widget]);
            },
        },
    });
