import {isolateHistory} from '@codemirror/commands';
import {EditorState, Prec, type Transaction} from '@codemirror/state';
import {EditorView, ViewPlugin, logException} from '@codemirror/view';
import {v4 as uuid} from 'uuid';

import {historyLockGuard} from '../../../markup/codemirror/history-lock';
import {resourceKey} from '../controller.utils';
import {replaceMarkdownResources} from '../markdown';

import {collectInsertedMarkupResources} from './collect-resources';
import {release, resolved, tracked} from './const';
import type {CodeMirrorResourceReplacementOptions} from './options';
import {pendingField} from './pending-state';
import {textChanges} from './prepare-replacements';
import {isHistoryTransaction, isOriginalLocalDocumentChange} from './transactions';

export function codeMirrorResourceReplacement(options: CodeMirrorResourceReplacementOptions) {
    if (!Object.values(options.resources).some(Boolean)) return [];
    const seen = new WeakSet<Transaction>();
    const lifetime = ViewPlugin.define(() => ({
        destroyed: false,
        destroy() {
            this.destroyed = true;
        },
    }));

    function applyReplacements(
        view: EditorView,
        instance: {destroyed: boolean},
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
        view.dispatch(transaction);
        if (!view.state.doc.eq(transaction.newDoc))
            throw new Error('Resource replacement was rejected');
    }

    function startOperation(view: EditorView, tr: Transaction, id: string) {
        const instance = view.plugin(lifetime)!;
        const releaseOperation = () => {
            if (!instance.destroyed) view.dispatch({effects: release.of(id)});
        };
        try {
            // Other extenders may have supplied the remote annotation after ours ran.
            if (!isOriginalLocalDocumentChange(tr)) {
                releaseOperation();
                return;
            }
            const entries = collectInsertedMarkupResources(tr, options);
            const urlKeys = new Set(
                entries.filter((entry) => entry.isUrl).map(({resource}) => resourceKey(resource)),
            );
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
                    isHistoryTransaction(tr)
                )
                    return [];
                return tr;
            }),
        ),
        EditorState.transactionExtender.of((tr) => {
            if (
                !options.controller.enabled ||
                !isOriginalLocalDocumentChange(tr) ||
                !options.shouldTrack(tr)
            )
                return null;
            return {annotations: [tracked.of(uuid()), isolateHistory.of('full')]};
        }),
        EditorView.updateListener.of((update) => {
            for (const tr of update.transactions) {
                if (seen.has(tr)) continue;
                seen.add(tr);
                const id = tr.annotation(tracked);
                if (id) startOperation(update.view, tr, id);
            }
        }),
    ];
}
