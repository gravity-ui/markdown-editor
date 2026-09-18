/** Resource metadata declared on a NodeSpec and shared by both editor modes. */
export type ResourceDescription = {
    kind: string;
    urlAttribute: string;
    nameAttribute?: string;
};

/** Explicit resource descriptions by node name. Unlisted nodes are not tracked. */
export type ResourceSpecOverrides = Readonly<Record<string, ResourceDescription | false>>;

/** Content transfers selected for resource replacement. */
export type ResourceTrigger =
    | 'paste'
    | 'drop'
    | {
          name: 'paste' | 'drop';
          /** Allow replacement when source and receiving editor IDs match. Defaults to false. */
          allowSameOrigin?: boolean;
      };

export type ResourceTrackingOptions = {
    /** Applied to NodeSpec at initialization. No defaults: omitted or empty tracks no resources. */
    resources?: ResourceSpecOverrides;
    /** Omitted or empty triggers disable the integrations. */
    triggers?: readonly ResourceTrigger[];
};

export type ReplacementResource = {
    /** Resource kind supplied by the integration (for example image, file or video). */
    kind: string;
    /** Relative path or full URL as represented by the parsed resource. */
    path: string;
    name?: string;
};

export type ResourceReplacementResult = {
    replacements: Array<{kind: ReplacementResource['kind']; oldPath: string; newPath: string}>;
};

/** Clipboard origin compared with the application-supplied ID of the receiving editor. */
export type ResourceReplacementSource = {
    sameEditor: boolean;
};

export type ResourceReplacementStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export type ResourceReplacementEvent = {
    operationId: string;
    status: ResourceReplacementStatus;
    error?: unknown;
};

export type ResourceReplacementConfig = ResourceTrackingOptions & {
    resolve?: (
        resources: readonly ReplacementResource[],
        context: {
            operationId: string;
            signal: AbortSignal;
            /** Absent when clipboard origin or the receiving editor's ID is unknown. */
            source?: ResourceReplacementSource;
        },
    ) => Promise<ResourceReplacementResult>;
    onChange?: (event: ResourceReplacementEvent) => void;
    /** Maximum wait, in milliseconds. Defaults to 120000. Must be finite and positive. */
    timeoutMs?: number;
};

export interface ResourceReplacementControl {
    getPendingResourceReplacements(): Array<{operationId: string}>;
    cancelResourceReplacement(operationId: string): void;
}
