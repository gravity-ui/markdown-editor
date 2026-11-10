import {describe, expect, it, vi} from 'vitest';

import {ReactRenderStorage} from './storage';

describe('ReactRenderStorage', () => {
    describe('Storage', () => {
        it('should return empty items list', () => {
            const items = new ReactRenderStorage().getItems();
            expect(items).toHaveLength(0);
        });

        it('should create renderer item', () => {
            const storage = new ReactRenderStorage();
            const item = storage.createItem('test', () => null);
            const items = storage.getItems();
            expect(items).toHaveLength(1);
            expect(items[0].id).toBe(item.id);
        });

        it('should emit event after creating item', () => {
            const listener = vi.fn();
            const storage = new ReactRenderStorage();
            storage.on('update', listener);
            storage.createItem('test', () => null);
            expect(listener).toBeCalledTimes(1);
        });

        it('should emit event after removal item', () => {
            const listener = vi.fn();
            const storage = new ReactRenderStorage();
            const item = storage.createItem('test', () => null);
            storage.on('update', listener);
            item.remove();
            expect(storage.getItems()).toHaveLength(0);
            expect(listener).toBeCalledTimes(1);
            expect(listener).toBeCalledWith(null);
        });

        it('should remove an item by its id', () => {
            const storage = new ReactRenderStorage();
            const removed = storage.createItem('removed', () => null);
            const kept = storage.createItem('kept', () => null);

            storage.removeItem(removed.id);

            expect(storage.getItems().map((item) => item.id)).toEqual([kept.id]);
        });

        it('should emit event after call item.rerender()', () => {
            const listener = vi.fn();
            const storage = new ReactRenderStorage();
            const item = storage.createItem('test', () => null);
            storage.getItems()[0].on('rerender', listener);
            item.rerender();
            expect(listener).toBeCalledTimes(1);
        });
    });
});
