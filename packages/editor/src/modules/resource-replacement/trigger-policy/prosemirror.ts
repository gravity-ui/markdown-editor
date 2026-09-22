import {Plugin, PluginKey, type Transaction} from 'prosemirror-state';

import type {Extension} from '../../../core/ExtensionBuilder';
import {ResourceReplacement, type ResourceReplacementOptions} from '../prosemirror';
import type {ResourceTrigger} from '../types';

import {isResourceTriggerEnabled} from './utils';

type TransferContext = {trigger: 'paste' | 'drop'; files: boolean};

const getTransactionTrigger = (tr: Transaction) => {
    if (tr.getMeta('uiEvent') === 'drop') return 'drop';
    if (tr.getMeta('paste') === true) return 'paste';
    return undefined;
};

export function createProseMirrorResourceIntegration({
    triggers,
    ...options
}: Omit<ResourceReplacementOptions, 'shouldTrack'> & {
    triggers: readonly ResourceTrigger[];
}): Extension {
    return (builder) => {
        let transferContext: TransferContext | undefined;
        const captureTransferContext = ({
            trigger,
            data,
        }: {
            trigger: 'paste' | 'drop';
            data: DataTransfer | null;
        }) => {
            const context = {
                trigger,
                files: Boolean(data?.files.length),
            };
            transferContext = context;
            queueMicrotask(() => {
                if (transferContext === context) transferContext = undefined;
            });
            return false;
        };
        const sourceMeta = new PluginKey('resourceClipboardSource');
        builder.addPlugin(
            () =>
                new Plugin({
                    filterTransaction: (tr) => {
                        if (
                            transferContext &&
                            getTransactionTrigger(tr) === transferContext.trigger &&
                            !tr.getMeta('appendedTransaction')
                        ) {
                            tr.setMeta(sourceMeta, transferContext);
                            transferContext = undefined;
                        }
                        return true;
                    },
                    props: {
                        handleDOMEvents: {
                            paste: (_view, event) =>
                                captureTransferContext({
                                    trigger: 'paste',
                                    data: event.clipboardData,
                                }),
                            drop: (_view, event) =>
                                captureTransferContext({
                                    trigger: 'drop',
                                    data: event.dataTransfer,
                                }),
                            blur: () => {
                                transferContext = undefined;
                                return false;
                            },
                        },
                    },
                    view: () => ({
                        destroy: () => {
                            transferContext = undefined;
                        },
                    }),
                }),
            builder.Priority.Highest,
        );
        builder.use(ResourceReplacement, {
            ...options,
            shouldTrack: (tr) => {
                const trigger = getTransactionTrigger(tr);
                const context = tr.getMeta(sourceMeta) as TransferContext | undefined;
                return Boolean(
                    trigger && !context?.files && isResourceTriggerEnabled(triggers, trigger),
                );
            },
        });
    };
}
