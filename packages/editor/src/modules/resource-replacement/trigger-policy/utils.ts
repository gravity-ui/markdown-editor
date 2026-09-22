import type {ResourceTrigger} from '../types';

export function isResourceTriggerEnabled(
    triggers: readonly ResourceTrigger[],
    name: 'paste' | 'drop',
): boolean {
    return triggers.some(
        (trigger) => (typeof trigger === 'string' ? trigger : trigger.name) === name,
    );
}
