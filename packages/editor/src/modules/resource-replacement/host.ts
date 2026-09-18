import type {ResourceReplacementEngine, ResourceTarget} from './tracking';
import type {ResourceReplacementSource} from './types';

/** Resource services bound to one engine mode; the owner controls disposal. */
export interface ResourceReplacementHost {
    readonly active: boolean;

    register(engine: ResourceReplacementEngine): () => void;
    getTarget(id: string): ResourceTarget | undefined;
    /** Schedule collection after the current batch of accepted view updates. */
    collectGarbage?(): void;

    resolve(
        targets: readonly ResourceTarget[],
        validatePath: (path: string) => void,
        source?: ResourceReplacementSource,
    ): void;
}
