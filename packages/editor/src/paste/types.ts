export type PastedResource = {
    kind: 'image' | 'file';
    /** Relative path or full URL as represented by the parsed resource. */
    path: string;
    name?: string;
};

export type PasteResourceResolution = {
    replacements: Array<{kind: PastedResource['kind']; oldPath: string; newPath: string}>;
};

export type PasteOperationStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export type PasteOperationEvent = {
    operationId: string;
    status: PasteOperationStatus;
    error?: unknown;
};

export type PasteIntegration = {
    resolvePastedResources?: (
        resources: readonly PastedResource[],
        context: {operationId: string; signal: AbortSignal},
    ) => Promise<PasteResourceResolution>;
    onPasteOperationChange?: (event: PasteOperationEvent) => void;
    /** Maximum wait, in milliseconds. Defaults to 120000. Must be finite and positive. */
    timeoutMs?: number;
};

export interface PasteOperationControl {
    getPendingPasteOperations(): Array<{operationId: string}>;
    /** @deprecated Use getPendingPasteOperations; this returns the oldest pending operation. */
    getPendingPasteOperation(): {operationId: string} | undefined;
    cancelPaste(operationId: string): void;
}
