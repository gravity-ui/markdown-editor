import type {ResourceReplacementSource, ResourceTrigger} from '../types';

export function isResourceTriggerEnabled(
    triggers: readonly ResourceTrigger[],
    name: Extract<ResourceTrigger, string>,
    source?: ResourceReplacementSource,
): boolean {
    return triggers.some((trigger) =>
        typeof trigger === 'string'
            ? trigger === name && !source?.sameEditor
            : trigger.name === name && (!source?.sameEditor || trigger.allowSameOrigin === true),
    );
}
