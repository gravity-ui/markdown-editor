import {ReactRenderStorage} from './index';

describe('ReactRenderer extension', () => {
    describe('Storage', () => {
        it('should renturn empty items list', () => {
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
            const listener = jest.fn();
            const storage = new ReactRenderStorage();
            storage.on('update', listener);
            storage.createItem('test', () => null);
            expect(listener).toBeCalledTimes(1);
        });

        it('should emit event after removal item', () => {
            const listener = jest.fn();
            const storage = new ReactRenderStorage();
            const item = storage.createItem('test', () => null);
            storage.on('update', listener);
            item.remove();
            expect(listener).toBeCalledTimes(1);
        });

        it('should emit event after call item.rerender()', () => {
            const listener = jest.fn();
            const storage = new ReactRenderStorage();
            const item = storage.createItem('test', () => null);
            storage.getItems()[0].on('rerender', listener);
            item.rerender();
            expect(listener).toBeCalledTimes(1);
        });
    });
});
