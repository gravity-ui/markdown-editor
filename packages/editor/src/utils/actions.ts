import {toggleMark} from 'prosemirror-commands';
import type {MarkType} from 'prosemirror-model';

import type {ActionSpec} from '../core';

import {canApplyInlineMarkInMarkdown, isMarkActive} from './marks';

export function defineActions<Keys extends string>(actions: Record<Keys, ActionSpec>) {
    return actions;
}

export function createToggleMarkAction(markType: MarkType): ActionSpec {
    const command = toggleMark(markType, undefined, {removeWhenPresent: false});
    return {
        isActive: (state) => Boolean(isMarkActive(state, markType)),
        isEnable: command,
        run: command,
    };
}

/**
 * Like createToggleMarkAction, but blocks applying the mark when the selection
 * boundaries would produce markdown that cannot round-trip (e.g. `word**,**`).
 * Removing the mark (toggling off) is always allowed.
 */
export function createMarkdownInlineMarkAction(markType: MarkType): ActionSpec {
    const base = createToggleMarkAction(markType);
    return {
        isActive: base.isActive,
        isEnable: (state, dispatch, view, attrs) => {
            const isBlocked =
                !isMarkActive(state, markType) && !canApplyInlineMarkInMarkdown(state);
            if (isBlocked) return false;
            return base.isEnable(state, dispatch, view, attrs);
        },
        run: (state, dispatch, view, attrs) => {
            const isBlocked =
                !isMarkActive(state, markType) && !canApplyInlineMarkInMarkdown(state);
            if (isBlocked) return;
            base.run(state, dispatch, view, attrs);
        },
    };
}
