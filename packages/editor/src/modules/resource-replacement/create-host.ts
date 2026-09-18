import type {ResourceReplacementController} from './controller';
import type {ResourceReplacementHost} from './host';
import {resourceKey} from './tracking';
import type {ResourceReplacementMode} from './tracking';
import type {ReplacementResource} from './types';

/** Bind shared resource services to the mode selected by the editor owner. */
export function createResourceReplacementHost(
    controller: ResourceReplacementController,
    mode: ResourceReplacementMode,
): ResourceReplacementHost {
    return {
        get active() {
            return controller.isActive(mode);
        },
        register: (engine) => controller.register(mode, engine),
        getTarget: (id) => controller.getTarget(id),
        collectGarbage: () => controller.collectGarbage(),
        resolve(targets, validatePath, source) {
            if (!targets.length) return;
            const resources = new Map<string, ReplacementResource>();
            const registered = targets.map(({id, resource}) => {
                const key = resourceKey(resource);
                if (!resources.has(key)) resources.set(key, resource);
                return controller.createTarget(resource, id);
            });
            controller.activate(mode);
            controller.resolveTargets([...resources.values()], registered, validatePath, source);
        },
    };
}
