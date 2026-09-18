import {ResourceReplacementController} from './controller';
import type {ResourceReplacementEngine} from './tracking';
import type {ResourceReplacementResult} from './types';

const resource = {kind: 'image', path: '/old.png'};
const result = {replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]};
const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
};

function setup() {
    let resolve!: (value: ResourceReplacementResult) => void;
    let reject!: (error: Error) => void;
    let signal!: AbortSignal;
    const controller = new ResourceReplacementController({
        resolve: (_resources, context) => {
            signal = context.signal;
            return new Promise((yes, no) => {
                resolve = yes;
                reject = no;
            });
        },
    });
    const references = new Set<string>();
    const forget = jest.fn();
    const engine: ResourceReplacementEngine = {
        snapshot: () => [],
        restore: () => {},
        flush: () => {},
        retainedTargets: () => references,
        forgetTargets: forget,
    };
    controller.register('wysiwyg', engine);
    const target = controller.createTarget(resource);
    controller.resolveTargets([resource], [target], () => {});
    return {
        controller,
        references,
        engine,
        forget,
        target,
        signal: () => signal,
        resolve: () => resolve(result),
        reject: () => reject(new Error('network')),
    };
}

test('pending targets survive collection even while absent from both engines', async () => {
    const t = setup();
    try {
        t.controller.collectGarbage();
        await flush();
        expect(t.controller.getTarget(t.target.id)).toBe(t.target);
        expect(t.signal().aborted).toBe(false);
        t.resolve();
        await flush();
        expect(t.controller.getTarget(t.target.id)).toBeUndefined();
    } finally {
        t.controller.destroy();
    }
});

test('retains results referenced by an inactive mode until all engines release them', async () => {
    const t = setup();
    const otherReferences = new Set([t.target.id]);
    const unregister = t.controller.register('markup', {
        ...t.engine,
        retainedTargets: () => otherReferences,
    });
    try {
        t.resolve();
        await flush();
        expect(t.controller.getTarget(t.target.id)?.replacement).toBe('/new.png');
        t.controller.activate('markup');
        t.references.add(t.target.id);
        otherReferences.clear();
        t.controller.collectGarbage();
        await flush();
        expect(t.controller.getTarget(t.target.id)).toBeDefined();
        t.references.clear();
        unregister();
        await flush();
        expect(t.controller.getTarget(t.target.id)).toBeUndefined();
    } finally {
        t.controller.destroy();
    }
});

test.each(['cancel', 'failure'] as const)(
    '%s releases live targets and ignores late results',
    async (kind) => {
        const t = setup();
        try {
            t.references.add(t.target.id);
            if (kind === 'cancel')
                t.controller.cancelResourceReplacement(
                    t.controller.getPendingResourceReplacements()[0].operationId,
                );
            else t.reject();
            await flush();
            expect(t.signal().aborted).toBe(true);
            expect(t.controller.getTarget(t.target.id)).toBeUndefined();
            expect(t.forget).toHaveBeenCalledWith(new Set([t.target.id]));
            t.resolve();
            await flush();
            expect(t.controller.getTarget(t.target.id)).toBeUndefined();
        } finally {
            t.controller.destroy();
        }
    },
);

test('unknown retention preserves successful results until a known engine replaces it', async () => {
    const t = setup();
    const unregister = t.controller.register('markup', {
        ...t.engine,
        retainedTargets: () => undefined,
    });
    try {
        t.resolve();
        await flush();
        expect(t.controller.getTarget(t.target.id)?.replacement).toBe('/new.png');
        unregister();
        await flush();
        expect(t.controller.getTarget(t.target.id)).toBeDefined();
        t.controller.register('markup', t.engine);
        await flush();
        expect(t.controller.getTarget(t.target.id)).toBeUndefined();
    } finally {
        t.controller.destroy();
    }
});
