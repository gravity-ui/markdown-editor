import type {ResourceTrigger} from './types';

export function isResourceTriggerEnabled(
    triggers: readonly ResourceTrigger[],
    name: 'paste' | 'drop',
): boolean {
    return triggers.includes(name);
}
