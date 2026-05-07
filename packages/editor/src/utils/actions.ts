import {toggleMark} from 'prosemirror-commands';
import type {MarkType} from 'prosemirror-model';
import type {Command} from 'prosemirror-state';

import type {ActionSpec} from '../core';

import {canApplyInlineMarkInMarkdown, isMarkActive} from './marks';

export function defineActions<Keys extends string>(actions: Record<Keys, ActionSpec>) {
    return actions;
}

export function createToggleMarkCommand(markType: MarkType): Command {
    return toggleMark(markType, undefined, {removeWhenPresent: false});
}

export function createToggleMarkAction(markType: MarkType): ActionSpec {
    const command = createToggleMarkCommand(markType);
    return {
        isActive: (state) => Boolean(isMarkActive(state, markType)),
        isEnable: command,
        run: (state, dispatch, view) => {
            command(state, dispatch, view);
        },
    };
}

export function createMarkdownInlineMarkCommand(markType: MarkType): Command {
    const base = createToggleMarkCommand(markType);
    return (state, dispatch, view) => {
        const isBlocked = !isMarkActive(state, markType) && !canApplyInlineMarkInMarkdown(state);
        if (isBlocked) return false;
        return base(state, dispatch, view);
    };
}

/**
 * Like createToggleMarkAction, but blocks applying the mark when the selection
 * boundaries would produce markdown that cannot round-trip (e.g. `word**,**`).
 * Removing the mark (toggling off) is always allowed.
 */
export function createMarkdownInlineMarkAction(markType: MarkType): ActionSpec {
    const base = createMarkdownInlineMarkCommand(markType);
    return {
        isActive: (state) => Boolean(isMarkActive(state, markType)),
        isEnable: (state, dispatch, view) => {
            return base(state, dispatch, view);
        },
        run: (state, dispatch, view) => {
            base(state, dispatch, view);
        },
    };
}
