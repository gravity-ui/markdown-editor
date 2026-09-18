// Shared API. Engine-specific implementations have separate entry points.
export {ResourceReplacementController} from './controller';
export {createResourceReplacementHost} from './create-host';
export type {ResourceReplacementHost} from './host';
export type {
    ResourceOccurrence,
    ResourceReplacementEngine,
    ResourceReplacementMode,
    ResourceTarget,
} from './tracking';
export type {
    ReplacementResource,
    ResourceDescription,
    ResourceSpecOverrides,
    ResourceReplacementConfig,
    ResourceReplacementControl,
    ResourceReplacementEvent,
    ResourceReplacementResult,
    ResourceReplacementSource,
    ResourceReplacementStatus,
    ResourceTrackingOptions,
    ResourceTrigger,
} from './types';
