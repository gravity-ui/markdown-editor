import type {Extension, ExtensionAuto} from '../../../core/ExtensionBuilder';
import type {ResourceTrigger} from '../../../modules/resource-replacement/types';

import {resourceReplacementPlugin} from './plugin';
import {createResourceSource} from './source';
import type {ResourceReplacementOptions} from './types';

export {isProseMirrorHistoryLocked} from './history-lock';
export {
    isResourceReplacementCleanupTransaction,
    remoteTransactionMeta,
    resolvedResourceMeta,
} from './meta';
export type {ResourceReplacementOptions} from './types';

export const ResourceReplacement: ExtensionAuto<ResourceReplacementOptions> = (
    builder,
    options,
) => {
    builder.addPlugin(() => resourceReplacementPlugin(options), builder.Priority.Lowest);
};

export function createProseMirrorResourceExtension({
    triggers,
    ...options
}: Omit<ResourceReplacementOptions, 'shouldProcessTransaction'> & {
    triggers: readonly ResourceTrigger[];
}): Extension {
    return (builder) => {
        const source = createResourceSource(triggers);
        builder.addPlugin(source.createPlugin, builder.Priority.Highest);
        builder.use(ResourceReplacement, {
            ...options,
            shouldProcessTransaction: source.shouldProcessTransaction,
        });
    };
}
