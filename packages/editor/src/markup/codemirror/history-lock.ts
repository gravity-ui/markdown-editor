import {type EditorState, Facet, Transaction, type TransactionSpec} from '@codemirror/state';
import {ViewPlugin} from '@codemirror/view';

export const historyLocked = Facet.define<boolean, boolean>({
    combine: (values) => values.some(Boolean),
});

/** Read synchronously before an external history engine changes its document. */
export function isCodeMirrorHistoryLocked(state: EditorState): boolean {
    return state.facet(historyLocked);
}

export function isHistoryTransaction(tr: Transaction) {
    return tr.isUserEvent('undo') || tr.isUserEvent('redo');
}

/** Штатные undo/redo обходят фильтры транзакций, поэтому проверяем и готовый dispatch. */
export function historyLockGuard() {
    return ViewPlugin.define((view) => {
        const dispatch = view.dispatch;
        const guarded: typeof dispatch = (
            ...input: [Transaction] | [readonly Transaction[]] | TransactionSpec[]
        ) => {
            const transactions =
                input[0] instanceof Transaction
                    ? [input[0]]
                    : Array.isArray(input[0])
                      ? input[0]
                      : [];
            if (view.state.facet(historyLocked) && transactions.some(isHistoryTransaction)) return;
            if (input[0] instanceof Transaction) dispatch(input[0]);
            else if (Array.isArray(input[0])) dispatch(input[0]);
            else dispatch(...(input as TransactionSpec[]));
        };
        view.dispatch = guarded;
        return {
            destroy() {
                if (view.dispatch === guarded) view.dispatch = dispatch;
            },
        };
    });
}
