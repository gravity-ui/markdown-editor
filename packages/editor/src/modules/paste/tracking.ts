import type {PastedResource} from './types';

/** Internal node attribute. Never serialize it to HTML or Markdown. */
export const pasteResourceId = '__pasteResourceId';

export type ResourceTarget = {
    id: string;
    resource: PastedResource;
    replacement?: string;
};

export type ResourceOccurrence = {
    kind: PastedResource['kind'];
    path: string;
    targetId?: string;
};

export type PasteEngine = {
    snapshot(): ResourceOccurrence[];
    restore(occurrences: ResourceOccurrence[]): void;
    flush(): void;
};

export type PasteMode = 'wysiwyg' | 'markup';

export function resourceKey(resource: Pick<PastedResource, 'kind' | 'path'>): string {
    return JSON.stringify([resource.kind, resource.path]);
}
