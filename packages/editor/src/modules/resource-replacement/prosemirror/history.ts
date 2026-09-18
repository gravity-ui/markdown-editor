import {history} from 'prosemirror-history';
import type {EditorState} from 'prosemirror-state';
import type {Step} from 'prosemirror-transform';

import {replaceResourceId} from '../tracking';

// Keep the dependency on prosemirror-history's Branch/Item shape in this adapter.
export const resourceHistoryKey = history().spec.key;
type Branch = {items: {forEach(callback: (item: {step?: Step}) => void): void}};
type HistoryState = {done: Branch; undone: Branch};
const stepTargets = new WeakMap<Step, ReadonlySet<string>>();

function collectSerializedIds(value: unknown, ids: Set<string>) {
    if (!value || typeof value !== 'object') return;
    const record = value as Record<string, unknown>;
    const id = record[replaceResourceId];
    if (typeof id === 'string') ids.add(id);
    // Inverse AttrSteps can restore an ID without containing a node or slice.
    if (record.attr === replaceResourceId && typeof record.value === 'string')
        ids.add(record.value);
    for (const child of Object.values(record)) collectSerializedIds(child, ids);
}

/** Undefined means that this history cannot safely be inspected. */
export function retainedHistoryTargets(state: EditorState): ReadonlySet<string> | undefined {
    const value = resourceHistoryKey?.getState(state) as HistoryState | undefined;
    const ids = new Set<string>();
    if (!value) return ids;
    if (
        typeof value.done?.items?.forEach !== 'function' ||
        typeof value.undone?.items?.forEach !== 'function'
    )
        return undefined;
    for (const branch of [value.done, value.undone]) {
        branch.items.forEach(({step}) => {
            if (!step) return;
            let retained = stepTargets.get(step);
            if (!retained) {
                const collected = new Set<string>();
                collectSerializedIds(step.toJSON(), collected);
                stepTargets.set(step, (retained = collected));
            }
            for (const id of retained) ids.add(id);
        });
    }
    return ids;
}
