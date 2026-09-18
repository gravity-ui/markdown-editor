import {historyField} from '@codemirror/commands';
import {
    type ChangeDesc,
    type ChangeSet,
    Compartment,
    type EditorSelection,
    type EditorState,
    StateEffect,
    type Transaction,
} from '@codemirror/state';

/*
 * CodeMirror exposes historyField, but no API for amending an older history event.
 * Keep the dependency on @codemirror/commands' HistoryState/HistEvent shape here.
 * Objects are cloned with their original prototypes; existing states are immutable.
 * The integration tests exercise undo/redo, intervening edits and remote mappings.
 */
type HistoryEvent = {
    changes?: ChangeSet;
    effects: readonly StateEffect<unknown>[];
    mapped?: ChangeDesc;
    startSelection?: EditorSelection;
    selectionsAfter: readonly EditorSelection[];
};
type HistoryState = {
    done: readonly HistoryEvent[];
    undone: readonly HistoryEvent[];
    addMapping(mapping: ChangeDesc): HistoryState;
};

function clone<T extends object>(value: T, props: Partial<T>): T {
    return Object.assign(Object.create(Object.getPrototypeOf(value)), value, props);
}

function mapEvent(event: HistoryEvent, mapping: ChangeDesc): HistoryEvent {
    const selectionsAfter = event.selectionsAfter.map((selection) => selection.map(mapping));
    if (!event.changes) return clone(event, {selectionsAfter});
    const before = mapping.mapDesc(event.changes, true);
    return clone(event, {
        changes: event.changes.map(mapping),
        effects: StateEffect.mapEffects(event.effects, mapping),
        mapped: event.mapped?.composeDesc(before) ?? before,
        startSelection: event.startSelection?.map(before),
        selectionsAfter,
    });
}

export class ResourceReplacementHistory {
    readonly compartment = new Compartment();

    retainedTargets(
        state: EditorState,
        readIds: (effect: StateEffect<unknown>) => readonly string[],
    ): ReadonlySet<string> | undefined {
        const history = state.field(historyField, false) as HistoryState | undefined;
        const ids = new Set<string>();
        if (!history) return ids;
        if (!Array.isArray(history.done) || !Array.isArray(history.undone)) return undefined;
        for (const event of [...history.done, ...history.undone]) {
            if (!Array.isArray(event.effects)) return undefined;
            for (const effect of event.effects) {
                for (const id of readIds(effect)) ids.add(id);
            }
        }
        return ids;
    }

    tagLast(state: EditorState, effect: StateEffect<unknown>) {
        const history = state.field(historyField, false) as HistoryState | undefined;
        if (!history?.done?.length) return [];
        const done = [...history.done];
        let index = done.length - 1;
        while (index >= 0 && (!done[index].changes || done[index].changes!.empty)) index--;
        if (index < 0) return [];
        done[index] = clone(done[index], {effects: [...done[index].effects, effect]});
        return [this.compartment.reconfigure(historyField.init(() => clone(history, {done})))];
    }

    amend(tr: Transaction, owns: (effects: readonly StateEffect<unknown>[]) => boolean) {
        const value = tr.startState.field(historyField, false);
        if (!value) return [];
        const history = value as HistoryState;
        if (!Array.isArray(history.done) || typeof history.addMapping !== 'function')
            throw new Error('Unsupported CodeMirror history implementation');
        if (!history.done.some((event) => owns(event.effects))) return [];

        const done: HistoryEvent[] = [];
        let existing: ChangeDesc | undefined;
        let patch = tr.changes;
        let doc = tr.startState.doc;
        for (let index = history.done.length - 1; index >= 0; index--) {
            let event: HistoryEvent = history.done[index];
            if (existing) event = mapEvent(event, existing);
            existing = event.mapped;
            if (event.changes && owns(event.effects)) {
                // Undo the patch together with its originating change, wherever that change is in history.
                const mapping = patch;
                done.unshift(
                    clone(event, {
                        changes: patch.invert(doc).compose(event.changes),
                        selectionsAfter: event.selectionsAfter.map((selection) =>
                            selection.map(mapping),
                        ),
                        mapped: undefined,
                    }),
                );
                doc = event.changes.apply(doc);
                // Only normalization of previously deferred mappings remains below this event.
                for (let older = index - 1; older >= 0; older--) {
                    let item: HistoryEvent = history.done[older];
                    if (existing) item = mapEvent(item, existing);
                    existing = item.mapped;
                    done.unshift(clone(item, {mapped: undefined}));
                }
                break;
            }
            const mapped = mapEvent(event, patch);
            done.unshift(clone(mapped, {mapped: undefined}));
            if (event.changes) {
                patch = patch.map(event.changes, true);
                doc = event.changes.apply(doc);
            }
        }
        const corrected = clone(history.addMapping(tr.changes.desc), {done});
        // Reconfiguration initializes fields before applying this transaction. Consume its
        // automatic mapping once, returning the already amended immutable history state.
        const initial = clone(history, {addMapping: () => corrected});
        return [this.compartment.reconfigure(historyField.init(() => initial))];
    }
}
