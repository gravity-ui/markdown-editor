import {Prec, type Transaction} from '@codemirror/state';
import {EditorView} from '@codemirror/view';

import {
    type CodeMirrorResourceReplacementOptions,
    codeMirrorResourceReplacement,
} from '../codemirror';
import type {ResourceTrigger} from '../types';

import {isResourceTriggerEnabled} from './utils';

type TransferContext = {
    trigger: 'paste' | 'drop';
    excludedFromReplacement: boolean;
};

const isUploadingFile = (data: DataTransfer | null) => {
    return Boolean(data?.files.length);
};

export function createCodeMirrorResourceIntegration({
    triggers,
    ...options
}: Omit<CodeMirrorResourceReplacementOptions, 'shouldTrack'> & {
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
            shouldTrack: (tr) => {
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

function getTransactionTrigger(tr: Transaction) {
    if (tr.isUserEvent('input.drop') || tr.isUserEvent('move.drop')) return 'drop';
    if (tr.isUserEvent('input.paste')) return 'paste';
    return undefined;
}
