import {Plugin, PluginKey, type Transaction} from 'prosemirror-state';

import type {Extension} from '../../../core/ExtensionBuilder';
import {ResourceReplacement, type ResourceReplacementOptions} from '../prosemirror';
import type {ResourceReplacementSource, ResourceTrigger} from '../types';

import {readClipboardSource, registerClipboardSource} from './clipboard-source';
import {isResourceTriggerEnabled} from './triggers';

/** Copy/drag provenance is independent of whether resource replacement is enabled. */
export function createProseMirrorClipboardSource(editorInstanceId: string): Extension {
    return (builder) => {
        builder.addPlugin(
            () =>
                new Plugin({
                    view: (view) => ({
                        destroy: registerClipboardSource(view.dom, editorInstanceId),
                    }),
                }),
        );
    };
}

/** Assemble clipboard policy and resource replacement for each ProseMirror editor. */
export function createProseMirrorResourceIntegration({
    triggers,
    editorInstanceId,
    ...options
}: Omit<ResourceReplacementOptions, 'shouldTrack' | 'getSource'> & {
    triggers: readonly ResourceTrigger[];
    editorInstanceId?: string;
}): Extension {
    return (builder) => {
        let shift = false;
        let transfer:
            | {trigger: 'paste' | 'drop'; source?: ResourceReplacementSource; files: boolean}
            | undefined;
        const sourceMeta = new PluginKey('resourceClipboardSource');
        const triggerOf = (tr: Transaction) => {
            if (tr.getMeta('uiEvent') === 'drop') return 'drop';
            if (tr.getMeta('paste') === true) return 'paste';
            return undefined;
        };
        const captureSource = (trigger: 'paste' | 'drop', data: DataTransfer | null) => {
            const context = {
                trigger,
                source: readClipboardSource(data, editorInstanceId),
                files: trigger === 'drop' && Boolean(data?.files.length),
            };
            transfer = context;
            queueMicrotask(() => {
                if (transfer === context) transfer = undefined;
            });
            return false;
        };
        builder.addPlugin(
            () =>
                new Plugin({
                    filterTransaction: (tr) => {
                        if (
                            transfer &&
                            triggerOf(tr) === transfer.trigger &&
                            !tr.getMeta('appendedTransaction')
                        ) {
                            tr.setMeta(sourceMeta, transfer);
                            transfer = undefined;
                        }
                        return true;
                    },
                    props: {
                        handleDOMEvents: {
                            paste: (_view, event) => captureSource('paste', event.clipboardData),
                            drop: (_view, event) => captureSource('drop', event.dataTransfer),
                            keydown: (_view, event) => {
                                shift = event.shiftKey;
                                return false;
                            },
                            keyup: (_view, event) => {
                                shift = event.shiftKey;
                                return false;
                            },
                            blur: () => {
                                shift = false;
                                transfer = undefined;
                                return false;
                            },
                        },
                    },
                    view: () => ({
                        destroy: () => {
                            shift = false;
                            transfer = undefined;
                        },
                    }),
                }),
            builder.Priority.Highest,
        );
        builder.use(ResourceReplacement, {
            ...options,
            shouldTrack: (tr) => {
                const trigger = triggerOf(tr);
                const context = tr.getMeta(sourceMeta) as typeof transfer;
                return Boolean(
                    trigger &&
                    !(trigger === 'paste' && shift) &&
                    !context?.files &&
                    isResourceTriggerEnabled(triggers, trigger, context?.source),
                );
            },
            getSource: (tr) => (tr.getMeta(sourceMeta) as typeof transfer)?.source,
        });
    };
}
