import {toggleMark} from 'prosemirror-commands';
import type {MarkType} from 'prosemirror-model';

import type {ActionSpec} from '../core';

import {isMarkActive} from './marks';

export function createToggleMarkAction(markType: MarkType): ActionSpec {
    const command = toggleMark(markType);
    return {
        isActive: (state) => Boolean(isMarkActive(state, markType)),
        isEnable: command,
        run: command,
    };
}
