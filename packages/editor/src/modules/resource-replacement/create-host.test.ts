import {ResourceReplacementController} from './controller';
import {createResourceReplacementHost} from './create-host';
import type {ReplacementResource} from './types';

it('binds registration and the active getter to the selected mode', () => {
    const controller = new ResourceReplacementController();
    const host = createResourceReplacementHost(controller, 'wysiwyg');
    const engine = {snapshot: jest.fn(() => []), restore: jest.fn(), flush: jest.fn()};
    const unregister = host.register(engine);
    expect(host.active).toBe(true);
    controller.activate('markup');
    expect(host.active).toBe(false);
    controller.activate('wysiwyg');
    expect(host.active).toBe(true);
    engine.flush.mockClear();
    unregister();
    controller.activate('wysiwyg');
    expect(engine.flush).not.toHaveBeenCalled();
    controller.destroy();
});

it('deduplicates resources while preserving each target identity and activates its mode', () => {
    const resolve = jest.fn(
        (_resources: readonly ReplacementResource[]) => new Promise<never>(() => {}),
    );
    const controller = new ResourceReplacementController({resolve});
    try {
        const host = createResourceReplacementHost(controller, 'wysiwyg');
        controller.activate('markup');
        const resource = {kind: 'image' as const, path: 'image.png'};
        host.resolve(
            [
                {id: 'first', resource},
                {id: 'second', resource: {...resource}},
            ],
            () => {},
        );
        expect(host.active).toBe(true);
        expect(host.getTarget('first')).toEqual({id: 'first', resource});
        expect(host.getTarget('second')).toEqual({id: 'second', resource});
        expect(resolve).toHaveBeenCalledTimes(1);
        expect(resolve.mock.calls[0][0]).toEqual([resource]);
    } finally {
        controller.destroy();
    }
});
