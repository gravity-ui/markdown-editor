import type {Receiver} from '../../../utils/event-emitter';

export interface Renderer<R> {
    createItem(idPrefix: string, render: () => R): RendererItem;
    removeItem(item: RendererItem): void;
    removeItem(id: string): void;
}

export type RendererItem = {
    readonly id: string;
    rerender(): void;
    remove(): void;
};

export type RenderStorageEventMap = {update: null};
export interface RenderStorage<R> extends Receiver<RenderStorageEventMap> {
    getItems(): readonly RenderStorageItem<R>[];
}

export type RenderStorageItemEventMap = {rerender: null};
export interface RenderStorageItem<R> extends Receiver<RenderStorageItemEventMap> {
    readonly id: string;
    render(): R;
}
