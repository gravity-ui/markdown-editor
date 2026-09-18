import {v4 as uuid} from 'uuid';

import {resourceKey} from './tracking';
import type {
    ResourceOccurrence,
    ResourceReplacementEngine,
    ResourceReplacementMode,
    ResourceTarget,
} from './tracking';
import type {
    ReplacementResource,
    ResourceReplacementConfig,
    ResourceReplacementControl,
    ResourceReplacementEvent,
    ResourceReplacementResult,
    ResourceReplacementSource,
} from './types';

export type ResourceReplacementRequest = {
    resources: readonly ReplacementResource[];
    source?: ResourceReplacementSource;
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
    private targets = new Map<string, ResourceTarget>();
    private pendingTargetIds = new Set<string>();
    private collectionScheduled = false;
    private engines = new Map<ResourceReplacementMode, ResourceReplacementEngine>();
    private detachedReferences = new Map<
        ResourceReplacementMode,
        ReadonlySet<string> | undefined
    >();
    private mode?: ResourceReplacementMode;
    private destroyed = false;
    private readonly timeout: number;

    private readonly options: ResourceReplacementConfig;
    private readonly reportError: (error: unknown) => void;

    constructor(
        options: ResourceReplacementConfig = {},
        reportError: (error: unknown) => void = console.error,
    ) {
        this.options = options;
        this.reportError = reportError;
        this.timeout = options.timeoutMs ?? 120_000;
        if (!Number.isFinite(this.timeout) || this.timeout <= 0) {
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

    register(mode: ResourceReplacementMode, engine: ResourceReplacementEngine) {
        this.detachedReferences.delete(mode);
        this.engines.set(mode, engine);
        this.mode ??= mode;
        this.collectGarbage();
        return () => {
            if (this.engines.get(mode) !== engine) return;
            // Removing a plugin does not dispose the mode's document/history. It may
            // be reattached later; retain its last references until then or destroy().
            try {
                const ids = engine.retainedTargets?.();
                this.detachedReferences.set(mode, ids && new Set(ids));
            } catch (error) {
                this.detachedReferences.set(mode, undefined);
                this.reportError(error);
            }
            this.engines.delete(mode);
            this.collectGarbage();
        };
    }

    isActive(mode: ResourceReplacementMode) {
        return this.mode === mode;
    }

    snapshot() {
        return this.enabled && this.mode ? this.engines.get(this.mode)?.snapshot() : undefined;
    }

    activate(mode: ResourceReplacementMode, snapshot?: ResourceOccurrence[]) {
        this.mode = mode;
        if (snapshot) this.engines.get(mode)?.restore(snapshot);
        this.flush();
    }

    createTarget(resource: ReplacementResource, id = uuid()) {
        const target: ResourceTarget = {id, resource};
        this.targets.set(target.id, target);
        return target;
    }

    getTarget(id: string): ResourceTarget | undefined {
        return this.targets.get(id);
    }

    resolveTargets(
        resources: readonly ReplacementResource[],
        targets: ResourceTarget[],
        validatePath: (path: string) => void,
        source?: ResourceReplacementSource,
    ) {
        let ownedTargets = targets;
        for (const target of ownedTargets) this.pendingTargetIds.add(target.id);
        const release = () => {
            for (const target of ownedTargets) this.pendingTargetIds.delete(target.id);
            // An uncooperative resolver may keep its promise alive after cancellation.
            ownedTargets = [];
            this.collectGarbage();
        };
        const started = this.start({
            resources,
            source: source && {...source},
            apply: (replacements) => {
                // Validate the entire response before caching any result, even after Undo.
                for (const path of replacements.values()) validatePath(path);
                for (const target of ownedTargets) {
                    target.replacement = replacements.get(resourceKey(target.resource));
                }
                try {
                    this.flush();
                } catch (error) {
                    for (const target of ownedTargets) target.replacement = undefined;
                    throw error;
                }
            },
            release,
        });
        if (!started) release();
        return started;
    }

    collectGarbage() {
        if (this.destroyed || this.collectionScheduled) return;
        this.collectionScheduled = true;
        // Mode switches and nested dispatches must finish before testing reachability.
        queueMicrotask(() => {
            this.collectionScheduled = false;
            if (this.destroyed || !this.targets.size) return;
            try {
                const retained = new Set<string>();
                let unknownHistory = false;
                for (const ids of this.detachedReferences.values()) {
                    if (ids) {
                        for (const id of ids) retained.add(id);
                    } else unknownHistory = true;
                }
                for (const engine of this.engines.values()) {
                    const ids = engine.retainedTargets?.();
                    if (!ids) {
                        unknownHistory = true;
                        break;
                    }
                    for (const id of ids) retained.add(id);
                }
                const removed = new Set<string>();
                for (const [id, target] of this.targets) {
                    if (this.pendingTargetIds.has(id)) continue;
                    if (target.replacement !== undefined && (unknownHistory || retained.has(id)))
                        continue;
                    this.targets.delete(id);
                    removed.add(id);
                }
                if (removed.size) {
                    for (const engine of this.engines.values()) engine.forgetTargets?.(removed);
                }
            } catch (error) {
                this.reportError(error);
            }
        });
    }

    start(prepared: ResourceReplacementRequest): boolean {
        if (this.destroyed) return false;
        if (!this.options.resolve || !prepared.resources.length) return false;
        const operation: Pending = {
            operationId: `resource-replacement-${++nextOperation}`,
            abort: new AbortController(),
            prepared,
        };
        this.pending.set(operation.operationId, operation);
        operation.timer = setTimeout(() => {
            this.finish(operation, 'failed', new Error('Resource replacement timed out'));
        }, this.timeout);
        this.event({operationId: operation.operationId, status: 'pending'});
        if (this.pending.get(operation.operationId) !== operation) return true;
        this.resolve(operation);
        return true;
    }

    fail(operationId: string, error: unknown) {
        const operation = this.pending.get(operationId);
        if (operation) this.finish(operation, 'failed', error);
    }

    cancelResourceReplacement(operationId: string) {
        const operation = this.pending.get(operationId);
        if (operation) this.finish(operation, 'cancelled');
    }

    destroy() {
        this.destroyed = true;
        for (const operation of this.pending.values()) this.finish(operation, 'cancelled');
        this.targets.clear();
        this.pendingTargetIds.clear();
        this.engines.clear();
        this.detachedReferences.clear();
    }

    private flush() {
        if (this.mode && !this.destroyed) this.engines.get(this.mode)?.flush();
    }

    private async resolve(operation: Pending) {
        try {
            const result = await this.options.resolve!(
                operation.prepared.resources.map((resource) => Object.freeze({...resource})),
                {
                    operationId: operation.operationId,
                    signal: operation.abort.signal,
                    ...(operation.prepared.source && {
                        source: Object.freeze({...operation.prepared.source}),
                    }),
                },
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
        this.event({
            operationId: operation.operationId,
            status,
            ...(error === undefined ? {} : {error}),
        });
    }

    private event(event: ResourceReplacementEvent) {
        try {
            this.options.onChange?.(event);
        } catch (error) {
            this.reportError(error);
        }
    }
}

export function validateResolution(
    resources: readonly ReplacementResource[],
    result: ResourceReplacementResult,
) {
    if (!result || !Array.isArray(result.replacements))
        throw new Error('Invalid resource replacement result');
    const keys = new Set(resources.map(resourceKey));
    const replacements = new Map<string, string>();
    for (const item of result.replacements) {
        if (
            !item ||
            typeof item.kind !== 'string' ||
            !item.kind ||
            typeof item.oldPath !== 'string' ||
            typeof item.newPath !== 'string' ||
            !item.newPath
        ) {
            throw new Error('Invalid resource replacement');
        }
        const key = resourceKey({kind: item.kind, path: item.oldPath});
        if (!keys.has(key)) throw new Error('Unknown resource replacement');
        if (replacements.has(key) && replacements.get(key) !== item.newPath) {
            throw new Error('Conflicting resource replacements');
        }
        replacements.set(key, item.newPath);
    }
    return replacements;
}
