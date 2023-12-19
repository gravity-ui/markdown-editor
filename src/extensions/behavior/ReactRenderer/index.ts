import {EditorState, Plugin, PluginKey} from 'prosemirror-state';
import type {ExtensionAuto} from '../../../core';
import {EventEmitter} from '../../../utils/event-emitter';
import {
    Renderer,
    RendererItem,
    RenderStorage,
    RenderStorageEventMap,
    RenderStorageItem,
    RenderStorageItemEventMap,
} from './types';

export type {RendererItem, RenderStorage} from './types';
export {Renderer as ReactRendererComponent} from './react';
export type {RendererProps as ReactRendererComponentProps} from './react';

const key = new PluginKey<ReactRenderer>('reactrenderer');
export function getReactRendererFromState(state: EditorState): ReactRenderer {
    const renderer = key.getState(state);
    if (!renderer) {
        throw new Error(
            'ReactRenderer is missing in the editor state. Probably, you forgot to use ReactRendererExtension',
        );
    }
    return renderer;
}

export type ReactRenderer = Renderer<React.ReactNode>;
export const ReactRendererExtension: ExtensionAuto<ReactRenderer> = (builder, renderer) => {
    builder.context.set('reactrenderer', renderer);
    builder.addPlugin(
        () =>
            new Plugin({
                key,
                state: {
                    init: () => renderer,
                    apply: () => renderer,
                },
            }),
        builder.Priority.Highest,
    );
};

declare global {
    namespace YfmEditor {
        interface Context {
            reactrenderer: ReactRenderer;
        }
    }
}

type RenderFn = () => React.ReactNode;
interface ReactStorageItem extends RendererItem, RenderStorageItem<React.ReactNode> {}
export class ReactRenderStorage
    extends EventEmitter<RenderStorageEventMap>
    implements ReactRenderer, RenderStorage<React.ReactNode>
{
    private static Item = class Item
        extends EventEmitter<RenderStorageItemEventMap>
        implements ReactStorageItem
    {
        private static GlobalId = 0;
        private static getNextId(): number {
            return this.GlobalId++;
        }

        readonly id: string;
        private readonly renderFn;
        private readonly removeFn;

        constructor(idPrefix: string, renderFn: RenderFn, removeFn: (item: Item) => void) {
            super();
            this.id = idPrefix + Item.getNextId();
            this.renderFn = renderFn;
            this.removeFn = removeFn;
        }

        render(): React.ReactNode {
            return this.renderFn();
        }

        remove(): void {
            this.removeFn(this);
        }

        rerender(): void {
            this.emit('rerender', null);
        }
    };

    #items: ReactStorageItem[] = [];

    getItems(): readonly RenderStorageItem<React.ReactNode>[] {
        return this.#items;
    }

    createItem(idPrefix: string, render: RenderFn): RendererItem {
        const item = new ReactRenderStorage.Item(idPrefix, render, this.removeItem.bind(this));
        this.#items.push(item);
        this.emit('update', null);
        return item;
    }

    removeItem(item: RendererItem): void;
    removeItem(id: string): void;
    removeItem(itemOrId: RendererItem | string): void {
        if (typeof itemOrId === 'string') {
            this.#items = this.#items.filter((item) => item.id !== itemOrId);
        } else {
            this.#items = this.#items.filter((item) => item !== itemOrId);
        }
        this.emit('update', null);
    }
}
