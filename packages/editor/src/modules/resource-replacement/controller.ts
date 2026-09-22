import {deduplicateResources, validateReplacements} from './controller.utils';
import type {
    ReplacementResource,
    ResourceReplacementConfig,
    ResourceReplacementControl,
    ResourceReplacementEvent,
} from './types';

export type ResourceReplacementRequest = {
    resources: readonly ReplacementResource[];
    apply: (replacements: ReadonlyMap<string, string>) => void;
    release: () => void;
};

type Pending = {
    operationId: string;
    abort: AbortController;
    prepared: ResourceReplacementRequest;
    timer?: ReturnType<typeof setTimeout>;
};

let nextOperation = 0;

/** One controller belongs to one editor, shared by its two modes. */
export class ResourceReplacementController implements ResourceReplacementControl {
    private pending = new Map<string, Pending>();
    private destroyed = false;
    private readonly timeout: number | undefined;

    private readonly onUpdate: () => void;
    private readonly options: ResourceReplacementConfig;
    private readonly reportError: (error: unknown) => void;

    constructor(
        options: ResourceReplacementConfig = {},
        reportError: (error: unknown) => void = console.error,
        onUpdate: () => void = () => {},
    ) {
        this.options = options;
        this.onUpdate = onUpdate;
        this.reportError = reportError;
        this.timeout = options.timeoutMs;
        if (this.timeout !== undefined && (!Number.isFinite(this.timeout) || this.timeout <= 0)) {
            throw new RangeError('resourceReplacement.timeoutMs must be finite and positive');
        }
    }

    get enabled() {
        return Boolean(this.options.resolve);
    }

    get busy() {
        return this.pending.size > 0;
    }

    getPendingResourceReplacements() {
        return [...this.pending.keys()].map((operationId) => ({operationId}));
    }

    start(prepared: ResourceReplacementRequest): boolean {
        if (this.destroyed) return false;
        if (!this.options.resolve || !prepared.resources.length) return false;
        const resources = deduplicateResources(prepared.resources);
        const operation: Pending = {
            operationId: `resource-replacement-${++nextOperation}`,
            abort: new AbortController(),
            prepared: {...prepared, resources},
        };
        this.pending.set(operation.operationId, operation);
        if (this.timeout !== undefined) {
            operation.timer = setTimeout(() => {
                this.finish(operation, 'failed', new Error('Resource replacement timed out'));
            }, this.timeout);
        }
        this.notifyOperationChange({operationId: operation.operationId, status: 'pending'});
        if (this.pending.get(operation.operationId) !== operation) return true;
        this.resolve(operation);
        return true;
    }

    cancelResourceReplacement(operationId: string) {
        const operation = this.pending.get(operationId);
        if (operation) this.finish(operation, 'cancelled');
    }

    destroy() {
        this.destroyed = true;
        for (const operation of this.pending.values()) this.finish(operation, 'cancelled');
    }

    private async resolve(operation: Pending) {
        try {
            const result = await this.options.resolve!(
                operation.prepared.resources.map((resource) => Object.freeze({...resource})),
                {
                    operationId: operation.operationId,
                    signal: operation.abort.signal,
                },
            );
            if (this.pending.get(operation.operationId) !== operation || this.destroyed) return;
            const replacements = validateReplacements(operation.prepared.resources, result);
            operation.prepared.apply(replacements);
            this.finish(operation, 'succeeded');
        } catch (error) {
            this.finish(operation, 'failed', error);
        }
    }

    private finish(
        operation: Pending,
        status: Exclude<ResourceReplacementEvent['status'], 'pending'>,
        error?: unknown,
    ) {
        const current = this.pending.get(operation.operationId);
        if (current !== operation) return;
        clearTimeout(operation.timer);
        this.pending.delete(operation.operationId);
        // Release the captured engine state before notifying application code.
        const prepared = operation.prepared;
        // A resolver that ignores abort may retain this operation until its promise settles.
        current.prepared = {resources: [], apply: () => {}, release: () => {}};
        try {
            prepared.release();
        } catch (releaseError) {
            this.reportError(releaseError);
        }
        if (status !== 'succeeded') operation.abort.abort();
        this.notifyOperationChange({
            operationId: operation.operationId,
            status,
            ...(error === undefined ? {} : {error}),
        });
    }

    private notifyOperationChange(event: ResourceReplacementEvent) {
        try {
            this.onUpdate();
        } catch (error) {
            this.reportError(error);
        }
        try {
            this.options.onChange?.(event);
        } catch (error) {
            this.reportError(error);
        }
    }
}
