/** Resource metadata supplied through resources and shared by both editor modes. */
export type ResourceDescription = {
    kind: string;
    valueAttribute: string;
    /** Opt into URL rules for a custom resource. Built-in image/src and file/href use them implicitly. */
    valueType?: 'url';
    nameAttribute?: string;
};

/** Explicit resource descriptions by node name. Unlisted nodes are not tracked. */
export type ResourceSpecOverrides = Readonly<Record<string, ResourceDescription | false>>;

/** Content transfers selected for resource replacement. */
export type ResourceTrigger = 'paste' | 'drop' | {name: 'paste' | 'drop'};

export type ResourceTrackingOptions = {
    /** Applied to NodeSpec at initialization. No defaults: omitted or empty tracks no resources. */
    resources?: ResourceSpecOverrides;
    /** Omitted or empty triggers disable the integrations. */
    triggers?: readonly ResourceTrigger[];
};

export type ReplacementResource = {
    /** Resource kind supplied by the integration (for example image, file or video). */
    kind: string;
    /** Parsed string value: an opaque identifier or a URL, according to its description. */
    value: string;
    name?: string;
};

export type ResourceReplacementResult = {
    replacements: Array<{kind: ReplacementResource['kind']; oldValue: string; newValue: string}>;
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
        },
    ) => Promise<ResourceReplacementResult>;
    onChange?: (event: ResourceReplacementEvent) => void;
    /** Maximum wait, in milliseconds. No timeout if omitted. Must be finite and positive. */
    timeoutMs?: number;
};

export interface ResourceReplacementControl {
    getPendingResourceReplacements(): Array<{operationId: string}>;
    cancelResourceReplacement(operationId: string): void;
}
