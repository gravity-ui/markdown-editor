import {get$Cursor, isNodeSelection, pType} from '@gravity-ui/markdown-editor';
import type {Keymap} from '@gravity-ui/markdown-editor/core';
import type {Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';

import {headerNodeType} from '../HeaderSpecs';
import {headerControlButtons} from '../const';

function headerPosition(state: EditorState): number | undefined {
    const {selection} = state;
    const type = headerNodeType(state.schema);
    if (isNodeSelection(selection) && selection.node.type === type) return selection.from;
    if (!selection.empty) return undefined;

    const {$from} = selection;
    for (let depth = $from.depth; depth > 0; depth--) {
        if ($from.node(depth).type === type) return $from.before(depth);
    }
    if ($from.nodeAfter?.type === type) return $from.pos;
    if ($from.nodeBefore?.type === type) return $from.pos - $from.nodeBefore.nodeSize;

    const $cursor = get$Cursor(selection);
    if ($cursor?.parent.type !== pType(state.schema)) return undefined;
    const before = state.doc.resolve($cursor.before());
    const after = state.doc.resolve($cursor.after());
    if ($cursor.parentOffset === 0 && before.nodeBefore?.type === type) {
        return before.pos - before.nodeBefore.nodeSize;
    }
    if ($cursor.parentOffset === $cursor.parent.content.size && after.nodeAfter?.type === type) {
        return after.pos;
    }
    return undefined;
}

const focusControls =
    (last: boolean): Command =>
    (state, _dispatch, view) => {
        if (!view) return false;
        const pos = headerPosition(state);
        if (pos === undefined) return false;
        const block = view.nodeDOM(pos);
        if (!(block instanceof HTMLElement)) return false;
        const buttons = headerControlButtons(block);
        const button = buttons[last ? buttons.length - 1 : 0];
        if (!button) return false;
        button.focus();
        return true;
    };

export const headerKeymap = (): Keymap => ({
    Tab: focusControls(false),
    'Shift-Tab': focusControls(true),
});
