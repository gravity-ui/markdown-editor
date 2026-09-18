import {syntaxTree} from '@codemirror/language';
import {Prec} from '@codemirror/state';
import {EditorView, ViewPlugin} from '@codemirror/view';

import {
    type CodeMirrorResourceReplacementOptions,
    codeMirrorResourceReplacement,
} from '../codemirror';
import {pasteHistoryBoundary} from '../codemirror/history-boundary';
import type {ResourceReplacementSource, ResourceTrigger} from '../types';

import {readClipboardSource, registerClipboardSource} from './clipboard-source';
import {isResourceTriggerEnabled} from './triggers';

/** The outer DOM listener runs after CodeMirror's handler on contentDOM. */
export function createCodeMirrorClipboardSource(editorInstanceId: string) {
    return ViewPlugin.define((view) => ({
        destroy: registerClipboardSource(view.dom, editorInstanceId),
    }));
}

/** Clipboard policy is assembled here, outside the reusable resource extension. */
export function createCodeMirrorResourceIntegration({
    triggers,
    editorInstanceId,
    ...options
}: Omit<CodeMirrorResourceReplacementOptions, 'shouldTrack' | 'getSource'> & {
    triggers: readonly ResourceTrigger[];
    editorInstanceId?: string;
}) {
    let shift = false;
    let event:
        | {
              trigger: 'paste' | 'drop';
              plain: boolean;
              boundary: boolean;
              source?: ResourceReplacementSource;
          }
        | undefined;
    const captureSource = (
        view: EditorView,
        trigger: 'paste' | 'drop',
        data: DataTransfer | null,
        pos: number,
    ) => {
        let code = false;
        for (let node = syntaxTree(view.state).resolveInner(pos, -1); node; node = node.parent!) {
            if (['FencedCode', 'CodeBlock', 'InlineCode'].includes(node.name)) code = true;
        }
        const source = readClipboardSource(data, editorInstanceId);
        const plain = code || (trigger === 'paste' ? shift : Boolean(data?.files.length));
        const context = (event = {
            trigger,
            plain,
            boundary: isResourceTriggerEnabled(triggers, trigger, source) && !plain,
            source,
        });
        if (context.boundary)
            for (const boundary of view.state.facet(pasteHistoryBoundary)) boundary();
        queueMicrotask(() => {
            if (event === context) event = undefined;
        });
        return false;
    };
    return [
        Prec.highest(
            EditorView.domEventHandlers({
                keydown: (keyboardEvent) => {
                    shift = keyboardEvent.shiftKey;
                    return false;
                },
                keyup: (keyboardEvent) => {
                    shift = keyboardEvent.shiftKey;
                    return false;
                },
                blur: () => {
                    shift = false;
                    event = undefined;
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
                const context = event;
                event = undefined;
                if (context?.boundary)
                    for (const boundary of update.state.facet(pasteHistoryBoundary)) boundary();
            }),
        ),
        codeMirrorResourceReplacement({
            ...options,
            shouldTrack: (tr) => {
                let trigger = event?.trigger;
                if (tr.isUserEvent('input.drop') || tr.isUserEvent('move.drop')) trigger = 'drop';
                else if (tr.isUserEvent('input.paste')) trigger = 'paste';
                return Boolean(
                    trigger &&
                    !event?.plain &&
                    isResourceTriggerEnabled(triggers, trigger, event?.source),
                );
            },
            getSource: () => event?.source,
        }),
    ];
}
