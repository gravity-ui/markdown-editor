import type {DependencyList} from 'react';

import {getDomConstructor} from '../utils/dom-constructor';

import {ElementClaims} from './element-claims';
import type {ViewerEffect, ViewerEffectCleanup, ViewerEffectContext} from './types';

export class ViewerLifecycle {
    readonly slotClaims = new ElementClaims();
    private entries = new Map<symbol, EffectEntry>();
    private claims = new ElementClaims();
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
        const root = this.root;
        if (!entry || entry.run || !root) return;

        const Controller = getDomConstructor(root, 'AbortController');
        const run: EffectRun = {controller: new Controller(), cleanups: new Set()};
        entry.run = run;

        const claim: ViewerEffectContext['claim'] = (element, claimKey, setup) => {
            if (entry.run !== run) return () => undefined;

            const release = this.claims.claim(element, claimKey, () =>
                entry.run === run ? setup() : undefined,
            );
            return trackCleanup(entry, run, release);
        };

        try {
            const cleanup = entry.setup({root, signal: run.controller.signal, claim});
            if (cleanup) trackCleanup(entry, run, cleanup);
        } catch (error) {
            if (entry.run === run) stopRuns([entry], [error]);
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
    cleanups: Set<ViewerEffectCleanup>;
}

function trackCleanup(entry: EffectEntry, run: EffectRun, cleanup: ViewerEffectCleanup) {
    if (entry.run !== run) {
        cleanup();
        return () => undefined;
    }
    run.cleanups.add(cleanup);
    return () => {
        if (run.cleanups.delete(cleanup)) cleanup();
    };
}

function sameDependencies(previous: DependencyList, next: DependencyList) {
    return (
        previous.length === next.length && previous.every((value, i) => Object.is(value, next[i]))
    );
}

function stopRuns(entries: EffectEntry[], errors: unknown[] = []) {
    const runs: EffectRun[] = [];
    for (const entry of entries) {
        if (entry.run) runs.push(entry.run);
        entry.run = undefined;
    }

    for (const run of runs) run.controller.abort();

    for (const run of runs) {
        for (const cleanup of run.cleanups) {
            try {
                run.cleanups.delete(cleanup);
                cleanup();
            } catch (error) {
                errors.push(error);
            }
        }
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Viewer effect cleanup failed');
}
