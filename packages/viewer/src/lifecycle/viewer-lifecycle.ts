import type {DependencyList} from 'react';

import type {ViewerEffect, ViewerEffectCleanup} from './types';

export class ViewerLifecycle {
    private entries = new Map<symbol, EffectEntry>();
    private root: HTMLDivElement | null = null;

    update(key: symbol, setup: ViewerEffect, dependencies: DependencyList) {
        const previous = this.entries.get(key);
        const changed = !previous || !sameDependencies(previous.dependencies, dependencies);
        const entry = previous || {setup, dependencies};
        entry.setup = setup;
        entry.dependencies = dependencies;
        this.entries.set(key, entry);

        if (changed) stopRuns([entry]);
        if (this.root) this.start(key);
    }

    remove(key: symbol) {
        const entry = this.entries.get(key);
        this.entries.delete(key);
        if (entry) stopRuns([entry]);
    }

    pause() {
        this.root = null;
        stopRuns([...this.entries.values()]);
    }

    resume(root: HTMLDivElement | null) {
        this.root = root;
        for (const key of this.entries.keys()) this.start(key);
    }

    private start(key: symbol) {
        const entry = this.entries.get(key);
        if (!entry || entry.run || !this.root) return;

        const run: EffectRun = {controller: new AbortController()};
        entry.run = run;
        try {
            run.cleanup = entry.setup({root: this.root, signal: run.controller.signal});
        } catch (error) {
            entry.run = undefined;
            run.controller.abort();
            throw error;
        }
    }
}

interface EffectEntry {
    setup: ViewerEffect;
    dependencies: DependencyList;
    run?: EffectRun;
}

interface EffectRun {
    controller: AbortController;
    cleanup?: void | ViewerEffectCleanup;
}

function sameDependencies(previous: DependencyList, next: DependencyList) {
    return (
        previous.length === next.length && previous.every((value, i) => Object.is(value, next[i]))
    );
}

function stopRuns(entries: EffectEntry[]) {
    const runs: EffectRun[] = [];
    for (const entry of entries) {
        if (entry.run) runs.push(entry.run);
        entry.run = undefined;
    }

    for (const run of runs) run.controller.abort();

    const errors: unknown[] = [];
    for (const run of runs) {
        try {
            run.cleanup?.();
        } catch (error) {
            errors.push(error);
        }
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Viewer effect cleanup failed');
}
