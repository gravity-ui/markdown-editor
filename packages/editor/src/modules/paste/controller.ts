import {v4 as uuid} from 'uuid';

import {resourceKey} from './tracking';
import type {PasteEngine, PasteMode, ResourceOccurrence, ResourceTarget} from './tracking';
import type {
    PasteIntegration,
    PasteOperationControl,
    PasteOperationEvent,
    PasteResourceResolution,
    PastedResource,
} from './types';

export type InsertedPaste = {
    resources: readonly PastedResource[];
    apply: (replacements: ReadonlyMap<string, string>) => void;
    release: () => void;
};

type Pending = {
    operationId: string;
    abort: AbortController;
    prepared: InsertedPaste;
    timer?: ReturnType<typeof setTimeout>;
};

let nextOperation = 0;

/** One controller belongs to one editor, shared by its two modes. */
export class PasteController implements PasteOperationControl {
    private pending = new Map<string, Pending>();
    private targets = new Map<string, ResourceTarget>();
    private engines = new Map<PasteMode, PasteEngine>();
    private mode?: PasteMode;
    private destroyed = false;
    private listeners = new Set<() => void>();
    private readonly timeout: number;

    private readonly options: PasteIntegration;
    private readonly reportError: (error: unknown) => void;

    constructor(
        options: PasteIntegration = {},
        reportError: (error: unknown) => void = console.error,
    ) {
        this.options = options;
        this.reportError = reportError;
        this.timeout = options.timeoutMs ?? 120_000;
        if (!Number.isFinite(this.timeout) || this.timeout <= 0) {
            throw new RangeError('paste.timeoutMs must be finite and positive');
        }
    }

    get enabled() {
        return Boolean(this.options.resolvePastedResources);
    }

    get busy() {
        return this.pending.size > 0;
    }

    getPendingPasteOperations() {
        return [...this.pending.keys()].map((operationId) => ({operationId}));
    }

    register(mode: PasteMode, engine: PasteEngine) {
        this.engines.set(mode, engine);
        this.mode ??= mode;
        return () => this.engines.delete(mode);
    }

    isActive(mode: PasteMode) {
        return this.mode === mode;
    }

    snapshot() {
        return this.enabled && this.mode ? this.engines.get(this.mode)?.snapshot() : undefined;
    }

    activate(mode: PasteMode, snapshot?: ResourceOccurrence[]) {
        this.mode = mode;
        if (snapshot) this.engines.get(mode)?.restore(snapshot);
        this.flush();
    }

    createTarget(resource: PastedResource) {
        const target: ResourceTarget = {id: uuid(), resource};
        this.targets.set(target.id, target);
        return target;
    }

    getTarget(id: string): ResourceTarget | undefined {
        return this.targets.get(id);
    }

    resolveTargets(
        resources: readonly PastedResource[],
        targets: ResourceTarget[],
        validatePath: (path: string) => void,
    ) {
        return this.start({
            resources,
            apply: (replacements) => {
                // Validate the entire response before caching any result, even after Undo.
                for (const path of replacements.values()) validatePath(path);
                for (const target of targets) {
                    target.replacement = replacements.get(resourceKey(target.resource));
                }
                try {
                    this.flush();
                } catch (error) {
                    for (const target of targets) target.replacement = undefined;
                    throw error;
                }
            },
            release: () => {},
        });
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    start(prepared: InsertedPaste): boolean {
        if (this.destroyed) return false;
        if (!this.options.resolvePastedResources || !prepared.resources.length) return false;
        const operation: Pending = {
            operationId: `paste-${++nextOperation}`,
            abort: new AbortController(),
            prepared,
        };
        this.pending.set(operation.operationId, operation);
        operation.timer = setTimeout(() => {
            this.finish(operation, 'failed', new Error('Paste resource resolution timed out'));
        }, this.timeout);
        this.notify();
        this.event({operationId: operation.operationId, status: 'pending'});
        if (this.pending.get(operation.operationId) !== operation) return true;
        this.resolve(operation);
        return true;
    }

    fail(operationId: string, error: unknown) {
        const operation = this.pending.get(operationId);
        if (operation) this.finish(operation, 'failed', error);
    }

    cancelPaste(operationId: string) {
        const operation = this.pending.get(operationId);
        if (operation) this.finish(operation, 'cancelled');
    }

    destroy() {
        this.destroyed = true;
        for (const operation of this.pending.values()) this.finish(operation, 'cancelled');
        this.targets.clear();
        this.engines.clear();
        this.listeners.clear();
    }

    private flush() {
        if (this.mode && !this.destroyed) this.engines.get(this.mode)?.flush();
    }

    private async resolve(operation: Pending) {
        try {
            const result = await this.options.resolvePastedResources!(
                operation.prepared.resources.map((resource) => Object.freeze({...resource})),
                {operationId: operation.operationId, signal: operation.abort.signal},
            );
            if (this.pending.get(operation.operationId) !== operation || this.destroyed) return;
            const replacements = validateResolution(operation.prepared.resources, result);
            operation.prepared.apply(replacements);
            this.finish(operation, 'succeeded');
        } catch (error) {
            this.finish(operation, 'failed', error);
        }
    }

    private finish(
        operation: Pending,
        status: Exclude<PasteOperationEvent['status'], 'pending'>,
        error?: unknown,
    ) {
        if (this.pending.get(operation.operationId) !== operation) return;
        clearTimeout(operation.timer);
        this.pending.delete(operation.operationId);
        // Release the captured engine state before notifying application code.
        try {
            operation.prepared.release();
        } catch (releaseError) {
            this.reportError(releaseError);
        }
        if (status !== 'succeeded') operation.abort.abort();
        this.notify();
        this.event({
            operationId: operation.operationId,
            status,
            ...(error === undefined ? {} : {error}),
        });
    }

    private notify() {
        for (const listener of this.listeners) {
            try {
                listener();
            } catch (error) {
                this.reportError(error);
            }
        }
    }

    private event(event: PasteOperationEvent) {
        try {
            this.options.onPasteOperationChange?.(event);
        } catch (error) {
            this.reportError(error);
        }
    }
}

export function validateResolution(
    resources: readonly PastedResource[],
    result: PasteResourceResolution,
) {
    if (!result || !Array.isArray(result.replacements)) throw new Error('Invalid paste resolution');
    const keys = new Set(resources.map(resourceKey));
    const replacements = new Map<string, string>();
    for (const item of result.replacements) {
        if (
            !item ||
            !['image', 'file'].includes(item.kind) ||
            typeof item.oldPath !== 'string' ||
            typeof item.newPath !== 'string' ||
            !item.newPath
        ) {
            throw new Error('Invalid paste resource replacement');
        }
        const key = resourceKey({kind: item.kind, path: item.oldPath});
        if (!keys.has(key)) throw new Error('Unknown paste resource replacement');
        if (replacements.has(key) && replacements.get(key) !== item.newPath) {
            throw new Error('Conflicting paste resource replacements');
        }
        replacements.set(key, item.newPath);
    }
    return replacements;
}
