import {ResourceReplacementController, validateResolution} from './controller';
import {resourceKey} from './tracking';
import type {ResourceReplacementResult} from './types';

const resources = [{kind: 'image' as const, path: '/old.png'}];
const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

function setup() {
    let resolve!: (value: ResourceReplacementResult) => void;
    let reject!: (reason: unknown) => void;
    const callback = jest.fn(
        () =>
            new Promise<ResourceReplacementResult>((yes, no) => {
                resolve = yes;
                reject = no;
            }),
    );
    const events = jest.fn();
    const apply = jest.fn();
    const release = jest.fn();
    const controller = new ResourceReplacementController({
        resolve: callback,
        onChange: events,
        timeoutMs: 100,
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

test('registers synchronously, applies before success and removes the finished operation before notification', async () => {
    const test = setup();
    test.events.mockImplementation((event) => {
        expect(test.controller.busy).toBe(event.status === 'pending');
        if (event.status === 'succeeded') expect(test.apply).toHaveBeenCalledTimes(1);
    });
    test.start();
    expect(test.controller.busy).toBe(true);
    expect(test.callback).toHaveBeenCalledTimes(1);
    test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
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
                    ? [{kind: 'image', oldPath: '/missing', newPath: '/new'}]
                    : kind === 'conflict'
                      ? [
                            {kind: 'image', oldPath: '/old.png', newPath: '/a'},
                            {kind: 'image', oldPath: '/old.png', newPath: '/b'},
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

test('timeout aborts the signal and observer exceptions do not leave pending operations', async () => {
    jest.useFakeTimers();
    const error = jest.fn();
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
    controller.start({resources, apply: jest.fn(), release: jest.fn()});
    jest.advanceTimersByTime(21);
    expect(controller.busy).toBe(false);
    expect(signal.aborted).toBe(true);
    expect(error).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
});

test('no callback or no resources preserves synchronous insertion', () => {
    expect(
        new ResourceReplacementController().start({
            resources,
            apply: jest.fn(),
            release: jest.fn(),
        }),
    ).toBe(false);
    const callback = jest.fn();
    expect(
        new ResourceReplacementController({resolve: callback}).start({
            resources: [],
            apply: jest.fn(),
            release: jest.fn(),
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

test('cancelling one concurrent operation does not cancel another', async () => {
    const resolvers: Array<(value: ResourceReplacementResult) => void> = [];
    const signals: AbortSignal[] = [];
    const controller = new ResourceReplacementController({
        resolve: (_resources, {signal}) => {
            signals.push(signal);
            return new Promise((resolve) => resolvers.push(resolve));
        },
    });
    const first = jest.fn();
    const second = jest.fn();
    controller.start({resources, apply: first, release: jest.fn()});
    controller.start({resources, apply: second, release: jest.fn()});
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

test('matches exact kind/path pairs independently and accepts identical duplicate replacements', () => {
    const resources = [
        {kind: 'image' as const, path: '/shared'},
        {kind: 'file' as const, path: '/shared'},
    ];
    const result = validateResolution(resources, {
        replacements: [
            {kind: 'image', oldPath: '/shared', newPath: '/image'},
            {kind: 'file', oldPath: '/shared', newPath: '/file'},
            {kind: 'image', oldPath: '/shared', newPath: '/image'},
        ],
    });
    expect(result.get(resourceKey(resources[0]))).toBe('/image');
    expect(result.get(resourceKey(resources[1]))).toBe('/file');
    expect(result.size).toBe(2);
    expect(() =>
        validateResolution(resources.slice(0, 1), {
            replacements: [{kind: 'file', oldPath: '/shared', newPath: '/file'}],
        }),
    ).toThrow('Unknown resource replacement');
});
