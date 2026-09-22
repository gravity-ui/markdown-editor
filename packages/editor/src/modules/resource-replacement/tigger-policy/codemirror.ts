import {syntaxTree} from '@codemirror/language';
import {Prec} from '@codemirror/state';
import {EditorView} from '@codemirror/view';

import {
    type CodeMirrorResourceReplacementOptions,
    codeMirrorResourceReplacement,
} from '../codemirror';
import type {ResourceTrigger} from '../types';

import {isResourceTriggerEnabled} from './utils';

type TransferContext = {
    trigger: 'paste' | 'drop';
    plain: boolean;
};

const isSourceInCode = ({view, pos}: {view: EditorView; pos: number}) => {
    for (let node = syntaxTree(view.state).resolveInner(pos, -1); node; node = node.parent!) {
        if (['FencedCode', 'CodeBlock', 'InlineCode'].includes(node.name)) return true;
    }
    return false;
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
    const captureSource = (
        view: EditorView,
        trigger: 'paste' | 'drop',
        data: DataTransfer | null,
        pos: number,
    ) => {
        const plain = isSourceInCode({view, pos}) || isUploadingFile(data);
        const context = {
            trigger,
            plain,
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
                paste: (clipboardEvent, view) =>
                    captureSource(
                        view,
                        'paste',
                        clipboardEvent.clipboardData,
                        view.state.selection.main.from,
                    ),
                drop: (dropEvent, view) =>
                    captureSource(
                        view,
                        'drop',
                        dropEvent.dataTransfer,
                        view.posAtCoords({x: dropEvent.clientX, y: dropEvent.clientY}, false),
                    ),
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
                let trigger = transferContext?.trigger;
                if (tr.isUserEvent('input.drop') || tr.isUserEvent('move.drop')) trigger = 'drop';
                else if (tr.isUserEvent('input.paste')) trigger = 'paste';
                return Boolean(
                    trigger && !transferContext?.plain && isResourceTriggerEnabled(triggers, trigger),
                );
            },
        }),
    ];
}
