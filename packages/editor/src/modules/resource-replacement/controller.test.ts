import {expect, test, vi} from 'vitest';

import {ResourceReplacementController} from './controller';
import {resourceKey, validateReplacements} from './controller.utils';
import type {ResourceReplacementConfig, ResourceReplacementResult} from './types';

const resources = [{kind: 'image' as const, value: '/old.png'}];
const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

function setup(options: Pick<ResourceReplacementConfig, 'timeoutMs'> = {timeoutMs: 100}) {
    let resolve!: (value: ResourceReplacementResult) => void;
    let reject!: (reason: unknown) => void;
    const callback = vi.fn<NonNullable<ResourceReplacementConfig['resolve']>>(
        () =>
            new Promise<ResourceReplacementResult>((yes, no) => {
                resolve = yes;
                reject = no;
            }),
    );
    const events = vi.fn();
    const apply = vi.fn();
    const release = vi.fn();
    const controller = new ResourceReplacementController({
        resolve: callback,
        onChange: events,
        ...options,
    });
    const start = () => controller.start({resources, apply, release});
    return {
        controller,
        callback,
        events,
        apply,
        release,
        start,
        resolve: (value: ResourceReplacementResult) => resolve(value),
        reject: (error: unknown) => reject(error),
    };
}

test('deduplicates request pairs while preserving the first name and different kinds', () => {
    const resolve = vi.fn(() => new Promise<never>(() => {}));
    const controller = new ResourceReplacementController({resolve});
    const resource = {kind: 'image', value: '/image', name: 'First'};
    const release = vi.fn();
    controller.start({
        resources: [resource, {...resource, name: 'Second'}, {...resource, kind: 'file'}],
        apply: vi.fn(),
        release,
    });
    expect(resolve).toHaveBeenCalledWith(
        [resource, {...resource, kind: 'file'}],
        expect.any(Object),
    );
    controller.destroy();
    expect(release).toHaveBeenCalledTimes(1);
});

test('registers synchronously, applies before success and removes the finished operation before notification', async () => {
    const test = setup();
    test.events.mockImplementation((event) => {
        expect(test.controller.busy).toBe(event.status === 'pending');
        if (event.status === 'succeeded') expect(test.apply).toHaveBeenCalledTimes(1);
    });
    test.start();
    expect(test.controller.busy).toBe(true);
    expect(test.callback).toHaveBeenCalledTimes(1);
    test.resolve({replacements: [{kind: 'image', oldValue: '/old.png', newValue: '/new.png'}]});
    await flush();
    expect(test.apply.mock.calls[0][0].get(resourceKey(resources[0]))).toBe('/new.png');
    expect(test.release).toHaveBeenCalledTimes(1);
    expect(test.events.mock.calls.map(([event]) => event.status)).toEqual(['pending', 'succeeded']);
});

test.each(['cancel', 'destroy', 'reject', 'invalid', 'conflict', 'apply-error'] as const)(
    '%s releases and never applies a late answer',
    async (kind) => {
        const test = setup();
        test.start();
        if (kind === 'cancel')
            test.controller.cancelResourceReplacement(
                test.controller.getPendingResourceReplacements()[0].operationId,
            );
        if (kind === 'destroy') test.controller.destroy();
        if (kind === 'reject') test.reject(new Error('network'));
        if (kind === 'apply-error')
            test.apply.mockImplementation(() => {
                throw new Error('insertion');
            });
        test.resolve({
            replacements:
                kind === 'invalid'
                    ? [{kind: 'image', oldValue: '/missing', newValue: '/new'}]
                    : kind === 'conflict'
                      ? [
                            {kind: 'image', oldValue: '/old.png', newValue: '/a'},
                            {kind: 'image', oldValue: '/old.png', newValue: '/b'},
                        ]
                      : [],
        });
        await flush();
        expect(test.controller.busy).toBe(false);
        expect(test.release).toHaveBeenCalledTimes(1);
        expect(test.events.mock.calls.map(([event]) => event.status)).toEqual([
            'pending',
            kind === 'cancel' || kind === 'destroy' ? 'cancelled' : 'failed',
        ]);
        expect(test.apply).toHaveBeenCalledTimes(kind === 'apply-error' ? 1 : 0);
    },
);

test('without a timeout a pending operation can still succeed after a long wait', async () => {
    vi.useFakeTimers();
    const test = setup({});
    try {
        test.start();
        vi.advanceTimersByTime(24 * 60 * 60 * 1000);
        await flush();
        expect(test.controller.getPendingResourceReplacements()).toHaveLength(1);
        expect(test.events.mock.calls.map(([event]) => event.status)).toEqual(['pending']);
        expect(test.release).not.toHaveBeenCalled();
        expect(test.apply).not.toHaveBeenCalled();

        test.resolve({replacements: [{kind: 'image', oldValue: '/old.png', newValue: '/new.png'}]});
        await flush();
        expect(test.apply.mock.calls[0][0].get(resourceKey(resources[0]))).toBe('/new.png');
        expect(test.release).toHaveBeenCalledTimes(1);
        expect(test.controller.busy).toBe(false);
        expect(test.events.mock.calls.map(([event]) => event.status)).toEqual([
            'pending',
            'succeeded',
        ]);
    } finally {
        test.controller.destroy();
        vi.useRealTimers();
    }
});

test.each([0, -1, NaN, Infinity])('rejects an invalid explicit timeout: %s', (timeoutMs) => {
    expect(() => new ResourceReplacementController({timeoutMs})).toThrow(
        'resourceReplacement.timeoutMs must be finite and positive',
    );
});

test('timeout aborts the signal and observer exceptions do not leave pending operations', async () => {
    vi.useFakeTimers();
    const error = vi.fn();
    let signal!: AbortSignal;
    const controller = new ResourceReplacementController(
        {
            timeoutMs: 20,
            resolve: (_resources, context) => {
                signal = context.signal;
                return new Promise(() => {});
            },
            onChange: () => {
                throw new Error('observer');
            },
        },
        error,
    );
    controller.start({resources, apply: vi.fn(), release: vi.fn()});
    vi.advanceTimersByTime(21);
    expect(controller.busy).toBe(false);
    expect(signal.aborted).toBe(true);
    expect(error).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
});

test('no callback or no resources preserves synchronous insertion', () => {
    expect(
        new ResourceReplacementController().start({
            resources,
            apply: vi.fn(),
            release: vi.fn(),
        }),
    ).toBe(false);
    const callback = vi.fn();
    expect(
        new ResourceReplacementController({resolve: callback}).start({
            resources: [],
            apply: vi.fn(),
            release: vi.fn(),
        }),
    ).toBe(false);
    expect(callback).not.toHaveBeenCalled();
});

test('cancelling an old ID cannot affect a new operation', async () => {
    const test = setup();
    test.start();
    const first = test.controller.getPendingResourceReplacements()[0].operationId;
    test.controller.cancelResourceReplacement(first);
    test.start();
    const second = test.controller.getPendingResourceReplacements()[0].operationId;
    test.controller.cancelResourceReplacement(first);
    expect(test.controller.getPendingResourceReplacements()).toEqual([{operationId: second}]);
    test.resolve({replacements: []});
    await flush();
    expect(test.events.mock.calls.map(([event]) => event.status)).toEqual([
        'pending',
        'cancelled',
        'pending',
        'succeeded',
    ]);
});

test.each(['resolve', 'reject'] as const)(
    'destroy clears timers and disables a controller even when its resolver later %ss',
    async (settlement) => {
        vi.useFakeTimers();
        const test = setup();
        try {
            test.start();
            const signal = test.callback.mock.calls[0][1].signal;
            expect(vi.getTimerCount()).toBe(1);
            test.controller.destroy();
            test.controller.destroy();
            expect(vi.getTimerCount()).toBe(0);
            expect(signal.aborted).toBe(true);
            expect(test.controller.enabled).toBe(false);
            expect(test.controller.getPendingResourceReplacements()).toEqual([]);
            expect(test.start()).toBe(false);
            expect(test.callback).toHaveBeenCalledTimes(1);
            if (settlement === 'resolve') {
                test.resolve({
                    replacements: [{kind: 'image', oldValue: '/old.png', newValue: '/late.png'}],
                });
            } else {
                test.reject(new Error('Late rejection'));
            }
            await flush();
            expect(test.apply).not.toHaveBeenCalled();
            expect(test.release).toHaveBeenCalledTimes(1);
            expect(test.events.mock.calls.map(([event]) => event.status)).toEqual([
                'pending',
                'cancelled',
            ]);
        } finally {
            test.controller.destroy();
            vi.clearAllTimers();
            vi.useRealTimers();
        }
    },
);

test('cancelling one concurrent operation does not cancel another', async () => {
    const resolvers: Array<(value: ResourceReplacementResult) => void> = [];
    const signals: AbortSignal[] = [];
    const controller = new ResourceReplacementController({
        resolve: (_resources, {signal}) => {
            signals.push(signal);
            return new Promise((resolve) => resolvers.push(resolve));
        },
    });
    const first = vi.fn();
    const second = vi.fn();
    controller.start({resources, apply: first, release: vi.fn()});
    controller.start({resources, apply: second, release: vi.fn()});
    const [a, b] = controller.getPendingResourceReplacements();
    controller.cancelResourceReplacement(a.operationId);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
    expect(controller.getPendingResourceReplacements()).toEqual([b]);
    resolvers[0]({replacements: []});
    resolvers[1]({replacements: []});
    await flush();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(controller.getPendingResourceReplacements()).toEqual([]);
    controller.destroy();
});

test('matches exact kind/value pairs independently and accepts identical duplicate replacements', () => {
    const resources = [
        {kind: 'image' as const, value: '/shared'},
        {kind: 'file' as const, value: '/shared'},
    ];
    const result = validateReplacements(resources, {
        replacements: [
            {kind: 'image', oldValue: '/shared', newValue: '/image'},
            {kind: 'file', oldValue: '/shared', newValue: '/file'},
            {kind: 'image', oldValue: '/shared', newValue: '/image'},
        ],
    });
    expect(result.get(resourceKey(resources[0]))).toBe('/image');
    expect(result.get(resourceKey(resources[1]))).toBe('/file');
    expect(result.size).toBe(2);
    expect(() =>
        validateReplacements(resources.slice(0, 1), {
            replacements: [{kind: 'file', oldValue: '/shared', newValue: '/file'}],
        }),
    ).toThrow('Unknown resource replacement');
});

test('opaque values are deduplicated and matched exactly without URL interpretation', () => {
    const values = [
        'asset:ABC/123',
        'asset:abc/123',
        ' asset:ABC/123 ',
        'a&amp;b',
        'a&b',
        '%41',
        'A',
    ];
    const requestedResources = values.map((value) => ({kind: 'asset', value}));
    const resolve = vi.fn(() => new Promise<never>(() => {}));
    const controller = new ResourceReplacementController({resolve});
    controller.start({
        resources: [...requestedResources, requestedResources[0]],
        apply: vi.fn(),
        release: vi.fn(),
    });
    expect(resolve).toHaveBeenCalledWith(requestedResources, expect.any(Object));
    const replacements = validateReplacements(requestedResources, {
        replacements: values.map((oldValue) => ({
            kind: 'asset',
            oldValue,
            newValue: ` ${oldValue} `,
        })),
    });
    expect(replacements.size).toBe(values.length);
    for (const resource of requestedResources)
        expect(replacements.get(resourceKey(resource))).toBe(` ${resource.value} `);
    expect(() =>
        validateReplacements([requestedResources[0]], {
            replacements: [{kind: 'asset', oldValue: values[1], newValue: 'new'}],
        }),
    ).toThrow('Unknown resource replacement');
    controller.destroy();
});

test.each([
    null,
    {},
    {replacements: {}},
    {replacements: [null]},
    ...['', 42, {}, null].map((newValue) => ({
        replacements: [{kind: 'image', oldValue: '/old.png', newValue}],
    })),
])('rejects malformed results and non-string or empty replacement values: %p', (result) => {
    expect(() => validateReplacements(resources, result as ResourceReplacementResult)).toThrow();
});

test('a nonempty whitespace identifier is not trimmed or rejected as a URL', () => {
    expect(
        validateReplacements(resources, {
            replacements: [{kind: 'image', oldValue: '/old.png', newValue: ' '}],
        }).get(resourceKey(resources[0])),
    ).toBe(' ');
});
