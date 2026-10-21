import type {CodemarkState} from 'prosemirror-codemark';
import {type EditorState, Plugin} from 'prosemirror-state';
import {Decoration, DecorationSet} from 'prosemirror-view';

import {get$Cursor} from '../../../utils/selection';

import {labelType} from './LabelSpecs';

// The fake cursor of prosemirror-codemark, which the Code extension uses at the edges of inline code.
// Next to a label the native caret takes the height of the label, so the cursor is drawn the same way.
const fakeCursorClassName = 'fake-cursor';
const noCursorClassName = 'no-cursor';

export const getLabelCursorState = (state: EditorState): CodemarkState => {
    const $cursor = get$Cursor(state.selection);
    if (!$cursor) return null;

    const type = labelType(state.schema);
    if ($cursor.nodeBefore?.type === type) return {active: true, side: -1};
    if ($cursor.nodeAfter?.type === type) return {active: true, side: 0};
    return null;
};

const createFakeCursor = () => {
    const span = document.createElement('span');
    span.classList.add(fakeCursorClassName);
    return span;
};

export const labelCursorPlugin = () =>
    new Plugin({
        props: {
            attributes: (state): Record<string, string> =>
                getLabelCursorState(state)?.active ? {class: noCursorClassName} : {},
            decorations(state) {
                const cursor = getLabelCursorState(state);
                if (!cursor?.active) return DecorationSet.empty;

                const widget = Decoration.widget(state.selection.from, createFakeCursor, {
                    side: cursor.side,
                    key: fakeCursorClassName,
                });
                return DecorationSet.create(state.doc, [widget]);
            },
        },
    });
