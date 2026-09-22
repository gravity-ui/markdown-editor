import {historyField} from '@codemirror/commands';
import {
    type ChangeDesc,
    ChangeSet,
    Compartment,
    type EditorSelection,
    StateEffect,
    type Text,
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

/** Only the originating paste ranges enter history; no resource identities or result cache. */
export const pasteEvent = StateEffect.define<Array<{from: number; to: number}>>({
    map: (ranges, changes) =>
        ranges.map((range) => ({
            from: changes.mapPos(range.from, -1),
            to: changes.mapPos(range.to, 1),
        })),
});

export class ResourceReplacementHistory {
    readonly compartment = new Compartment();

    amend(tr: Transaction) {
        const value = tr.startState.field(historyField, false);
        if (!value) return [];
        const history = value as HistoryState;
        if (!Array.isArray(history.done) || typeof history.addMapping !== 'function')
            throw new Error('Unsupported CodeMirror history implementation');
        if (
            !history.done.some((event) =>
                event.effects.some((effect: StateEffect<unknown>) => effect.is(pasteEvent)),
            )
        )
            return [];

        const done: HistoryEvent[] = [];
        let existing: ChangeDesc | undefined;
        let patch = tr.changes;
        let doc = tr.startState.doc;
        for (let index = history.done.length - 1; index >= 0; index--) {
            let event: HistoryEvent = history.done[index];
            if (existing) event = mapEvent(event, existing);
            existing = event.mapped;
            const owned = event.effects.flatMap((effect) =>
                effect.is(pasteEvent) ? effect.value : [],
            );
            // Typing may insert another resource while waiting. Its inverse deletion
            // must remove the replacement too, rather than leave an orphaned URL.
            event.changes?.iterChanges((from, to, _fromB, _toB, insert) => {
                if (from < to && insert.length === 0) owned.push({from, to});
            });
            if (event.changes && owned.length) {
                const remaining: Array<{
                    from: number;
                    to: number;
                    insert: Text;
                }> = [];
                patch.iterChanges((from, to, _fromB, _toB, insert) => {
                    if (!owned.some((range) => from >= range.from && to <= range.to))
                        remaining.push({from, to, insert});
                });
                const after = ChangeSet.of(remaining, doc.length).map(event.changes, true);
                const mapping = patch;
                done.unshift(
                    clone(event, {
                        changes: patch.invert(doc).compose(event.changes).compose(after),
                        effects: StateEffect.mapEffects(event.effects, patch),
                        selectionsAfter: event.selectionsAfter.map((selection) =>
                            selection.map(mapping),
                        ),
                        startSelection: event.startSelection?.map(after),
                        mapped: undefined,
                    }),
                );
                doc = event.changes.apply(doc);
                patch = after;
                continue;
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
