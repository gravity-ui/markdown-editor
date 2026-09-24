import {Plugin, PluginKey, type Transaction} from 'prosemirror-state';

import {isResourceTriggerEnabled} from '../../../modules/resource-replacement/triggers';
import type {ResourceTrigger} from '../../../modules/resource-replacement/types';

import type {ResourceReplacementOptions} from './types';

type TransferContext = {trigger: 'paste' | 'drop'; files: boolean};

const getTransactionTrigger = (tr: Transaction) => {
    if (tr.getMeta('uiEvent') === 'drop') return 'drop';
    if (tr.getMeta('paste') === true) return 'paste';
    return undefined;
};

export function createResourceSource(triggers: readonly ResourceTrigger[]): {
    createPlugin: () => Plugin;
    shouldProcessTransaction: ResourceReplacementOptions['shouldProcessTransaction'];
} {
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

    return {
        createPlugin: () =>
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
        shouldProcessTransaction: (tr) => {
            const trigger = getTransactionTrigger(tr);
            const context = tr.getMeta(sourceMeta) as TransferContext | undefined;
            return Boolean(
                trigger && !context?.files && isResourceTriggerEnabled(triggers, trigger),
            );
        },
    };
}
