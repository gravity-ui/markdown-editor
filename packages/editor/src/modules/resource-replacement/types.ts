/** NodeSpec._resource metadata shared by both editor modes. */
export type ResourceDescription = {
    kind: string;
    valueAttribute: string;
    /** Opt into URL rules for a custom resource. Built-in image/src and file/href use them implicitly. */
    valueType?: 'url';
    nameAttribute?: string;
};

/** Content transfers selected for resource replacement. */
export type ResourceTrigger = 'paste' | 'drop';

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

export type ResourceReplacementConfig = {
    /** Omitted or empty triggers disable the integrations. */
    triggers?: readonly ResourceTrigger[];
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
