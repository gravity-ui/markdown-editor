import type {ReplacementResource} from './types';

/** Internal node attribute. Never serialize it to HTML or Markdown. */
export const replaceResourceId = '__replaceResourceId';

export type ResourceTarget = {
    id: string;
    resource: ReplacementResource;
    replacement?: string;
};

export type ResourceOccurrence = {
    kind: ReplacementResource['kind'];
    path: string;
    targetId?: string;
};

export type ResourceReplacementEngine = {
    snapshot(): ResourceOccurrence[];
    restore(occurrences: ResourceOccurrence[]): void;
    flush(): void;
    /** IDs reachable from the document and both history branches. Unknown retention disables collection. */
    retainedTargets?(): ReadonlySet<string> | undefined;
    /** Remove collected IDs from the live document without creating an Undo step. */
    forgetTargets?(ids: ReadonlySet<string>): void;
};

export type ResourceReplacementMode = 'wysiwyg' | 'markup';

export function resourceKey(resource: Pick<ReplacementResource, 'kind' | 'path'>): string {
    return JSON.stringify([resource.kind, resource.path]);
}
