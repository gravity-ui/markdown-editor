import {PluginKey, type Transaction} from '#pm/state';
import type {DecorationSet} from '#pm/view';

export type HoverState = null | {
    rowIdx: number;
    columnIdx: number;
    tablePos: number;
};

export type PluginState = {
    hover: HoverState;
    activeTablePos: number | null;
    decorations: DecorationSet;
};

export const focusPluginKey = new PluginKey<PluginState>('TableControlsPlugin');

export function hideHoverDecos(tr: Transaction) {
    return tr.setMeta(focusPluginKey, {newState: null});
}
