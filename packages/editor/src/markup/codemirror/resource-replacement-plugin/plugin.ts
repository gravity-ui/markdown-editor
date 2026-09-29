import {isolateHistory} from '@codemirror/commands';
import {EditorState, Prec, StateField, Transaction} from '@codemirror/state';
import {EditorView, ViewPlugin, logException} from '@codemirror/view';
import {v4 as uuid} from 'uuid';

import type {ResourceReplacementController} from '../../../modules/resource-replacement/controller';
import {collectRequestedUrlKeys} from '../../../modules/resource-replacement/read-node-resource';
import {isResourceTriggerEnabled} from '../../../modules/resource-replacement/triggers';
import type {ResourceTrigger} from '../../../modules/resource-replacement/types';
import {historyLockGuard, historyLocked, isLocalHistoryTransaction} from '../history-lock';

import {release, resolved, tracked} from './effects';
import {type ResourceMarkdownOptions, replaceMarkdownResources} from './markdown';
import {
    collectInsertedMarkupResources,
    getTransactionTrigger,
    isOriginalLocalDocumentChange,
    textChanges,
} from './utils';

export type CodeMirrorResourceReplacementOptions = ResourceMarkdownOptions & {
    controller: Pick<ResourceReplacementController, 'enabled' | 'busy' | 'start'>;
    /** Pure predicate selecting local document changes. */
    shouldProcessTransaction: (transaction: Transaction) => boolean;
};

/** Includes accepted insertions whose update listener has not started resolve yet. */
export const pendingField = StateField.define<readonly string[]>({
    create: () => [],
    provide: (field) => historyLocked.from(field, (operations) => operations.length > 0),
    update(operations, tr) {
        for (const effect of tr.effects) {
            if (effect.is(release)) operations = operations.filter((id) => id !== effect.value);
        }
        const id = tr.annotation(tracked);
        return id ? [...operations, id] : operations;
    },
});

export function codeMirrorResourceReplacement(options: CodeMirrorResourceReplacementOptions) {
    if (!options.controller.enabled) return [];
    type Application = {transaction: Transaction; accepted: boolean};
    const lifetime = ViewPlugin.define(() => ({
        destroyed: false,
        application: undefined as Application | undefined,
        destroy() {
            this.destroyed = true;
        },
    }));

    function applyReplacements(
        view: EditorView,
        instance: {destroyed: boolean; application?: Application},
        replacements: ReadonlyMap<string, string>,
        urlKeys: ReadonlySet<string>,
    ) {
        if (instance.destroyed) throw new Error('Editor was destroyed');
        const state = view.state;
        const before = state.doc.toString();
        const after = replaceMarkdownResources(before, replacements, options, urlKeys);
        if (after === undefined || after === before) return;
        if (instance.destroyed) throw new Error('Editor was destroyed');
        if (view.state !== state) throw new Error('Editor changed during resource transformation');
        if (view.state.readOnly || !view.state.facet(EditorView.editable))
            throw new Error('Editor is no longer editable');
        const transaction = view.state.update({
            changes: textChanges(before, after),
            annotations: [resolved.of(true), isolateHistory.of('full')],
        });
        if (transaction.newDoc.toString() !== after)
            throw new Error('Resource replacement was rejected');
        if (instance.destroyed) throw new Error('Editor was destroyed');
        if (view.state !== state) throw new Error('Editor changed during resource transformation');
        if (view.state.readOnly || !view.state.facet(EditorView.editable))
            throw new Error('Editor is no longer editable');
        const previous = instance.application;
        const application: Application = {transaction, accepted: false};
        instance.application = application;
        try {
            view.dispatch(transaction);
            if (!application.accepted) throw new Error('Resource replacement was rejected');
        } finally {
            instance.application = previous;
        }
    }

    function startOperation(view: EditorView, tr: Transaction, id: string) {
        const instance = view.plugin(lifetime)!;
        const releaseOperation = () => {
            if (!instance.destroyed)
                view.dispatch({
                    effects: release.of(id),
                    filter: false,
                    annotations: Transaction.addToHistory.of(false),
                });
        };
        try {
            // Other extenders may have supplied the remote annotation after ours ran.
            if (!isOriginalLocalDocumentChange(tr)) {
                releaseOperation();
                return;
            }
            const entries = collectInsertedMarkupResources(tr, options);
            const urlKeys = collectRequestedUrlKeys(entries);
            const started = options.controller.start({
                resources: entries.map(({resource}) => resource),
                release: releaseOperation,
                apply: (replacements) => applyReplacements(view, instance, replacements, urlKeys),
            });
            if (!started) releaseOperation();
        } catch (error) {
            releaseOperation();
            logException(view.state, error, 'Collecting pasted resources');
        }
    }

    return [
        pendingField,
        lifetime,
        historyLockGuard(),
        Prec.highest(
            EditorState.transactionFilter.of((tr) => {
                if (
                    (options.controller.busy || tr.startState.field(pendingField).length) &&
                    isLocalHistoryTransaction(tr)
                )
                    return [];
                return tr;
            }),
        ),
        EditorState.transactionExtender.of((tr) => {
            if (
                !options.controller.enabled ||
                !isOriginalLocalDocumentChange(tr) ||
                !options.shouldProcessTransaction(tr)
            )
                return null;
            return {annotations: [tracked.of(uuid()), isolateHistory.of('full')]};
        }),
        EditorView.updateListener.of((update) => {
            const application = update.view.plugin(lifetime)?.application;
            if (application && update.transactions.includes(application.transaction))
                application.accepted = true;
            for (const tr of update.transactions) {
                const id = tr.annotation(tracked);
                if (id) startOperation(update.view, tr, id);
            }
        }),
    ];
}

type TransferContext = {
    trigger: 'paste' | 'drop';
    excludedFromReplacement: boolean;
};

const isUploadingFile = (data: DataTransfer | null) => {
    return Boolean(data?.files.length);
};

export function createCodeMirrorResourceExtension({
    triggers,
    ...options
}: Omit<CodeMirrorResourceReplacementOptions, 'shouldProcessTransaction'> & {
    triggers: readonly ResourceTrigger[];
}) {
    let transferContext: TransferContext | undefined;
    const captureTransferContext = (trigger: 'paste' | 'drop', data: DataTransfer | null) => {
        const excludedFromReplacement = isUploadingFile(data);
        const context = {
            trigger,
            excludedFromReplacement,
        };
        transferContext = context;
        queueMicrotask(() => {
            if (transferContext === context) transferContext = undefined;
        });
        return false;
    };

    return [
        Prec.highest(
            EditorView.domEventHandlers({
                blur: () => {
                    transferContext = undefined;
                    return false;
                },
                paste: (clipboardEvent) =>
                    captureTransferContext('paste', clipboardEvent.clipboardData),
                drop: (dropEvent) => captureTransferContext('drop', dropEvent.dataTransfer),
            }),
        ),
        Prec.highest(
            EditorView.updateListener.of((update) => {
                if (!update.docChanged) return;
                transferContext = undefined;
            }),
        ),
        codeMirrorResourceReplacement({
            ...options,
            shouldProcessTransaction: (tr) => {
                const trigger = getTransactionTrigger(tr) ?? transferContext?.trigger;
                return Boolean(
                    trigger &&
                    !transferContext?.excludedFromReplacement &&
                    isResourceTriggerEnabled(triggers, trigger),
                );
            },
        }),
    ];
}
