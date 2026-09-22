import type {Extension, ExtensionAuto} from '../../../core/ExtensionBuilder';
import type {ResourceTrigger} from '../../../modules/resource-replacement/types';

import {resourceReplacementPlugin} from './plugin';
import {createResourceSource} from './source';
import type {ResourceReplacementOptions} from './types';

export {remoteTransactionMeta, resolvedResourceMeta} from './meta';
export type {ResourceReplacementOptions} from './types';

export const ResourceReplacement: ExtensionAuto<ResourceReplacementOptions> = (
    builder,
    options,
) => {
    for (const nodeType of builder.nodeSpecNames()) {
        builder.overrideNodeSpec(nodeType, (spec) => {
            const resource = spec._resource;
            if (
                resource &&
                (!resource.kind ||
                    !resource.valueAttribute ||
                    !spec.attrs?.[resource.valueAttribute])
            )
                throw new Error(`Invalid resource description: ${nodeType}`);
            return spec;
        });
    }
    builder.addPlugin(() => resourceReplacementPlugin(options), builder.Priority.Lowest);
};

export function createProseMirrorResourceExtension({
    triggers,
    ...options
}: Omit<ResourceReplacementOptions, 'shouldTrack'> & {
    triggers: readonly ResourceTrigger[];
}): Extension {
    return (builder) => {
        const source = createResourceSource(triggers);
        builder.addPlugin(source.createPlugin, builder.Priority.Highest);
        builder.use(ResourceReplacement, {...options, shouldTrack: source.shouldTrack});
    };
}
