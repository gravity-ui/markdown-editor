import type {Extension, ExtensionAuto} from '../../../core/ExtensionBuilder';
import type {
    ResourceSpecOverrides,
    ResourceTrigger,
} from '../../../modules/resource-replacement/types';

import {resourceReplacementPlugin} from './plugin';
import {createResourceSource} from './source';
import type {ResourceReplacementOptions} from './types';

export {remoteTransactionMeta, resolvedResourceMeta} from './meta';
export type {ResourceReplacementOptions} from './types';

/** Apply bundle resource configuration after user extensions have registered their nodes. */
export function createConfiguredResourceExtension({
    resources,
    controller,
    triggers,
}: {
    resources: ResourceSpecOverrides;
    controller?: ResourceReplacementOptions['controller'];
    triggers: readonly ResourceTrigger[];
}): Extension {
    return (builder) => {
        for (const nodeType of Object.keys(resources)) {
            if (!builder.hasNodeSpec(nodeType))
                throw new Error(`Unknown resource node type: ${nodeType}`);
        }
        // Unlisted nodes must not inherit resource metadata from extensions.
        for (const nodeType of builder.nodeSpecNames()) {
            const resource = resources[nodeType];
            builder.overrideNodeSpec(nodeType, (spec) => ({
                ...spec,
                _resource: resource || undefined,
            }));
        }
        if (controller && triggers.length) {
            builder.use(createProseMirrorResourceExtension({controller, triggers}));
        }
    };
}

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
