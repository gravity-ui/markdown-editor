// Shared API. Engine-specific implementations have separate entry points.
export {ResourceReplacementController} from './controller';
export type {
    ReplacementResource,
    ResourceDescription,
    ResourceSpecOverrides,
    ResourceReplacementConfig,
    ResourceReplacementControl,
    ResourceReplacementEvent,
    ResourceReplacementResult,
    ResourceReplacementStatus,
    ResourceTrackingOptions,
    ResourceTrigger,
} from './types';
