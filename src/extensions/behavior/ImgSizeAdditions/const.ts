import {PluginKey} from 'prosemirror-state';

export const IMG_MAX_HEIGHT = 600; //px
export type ImageRendererState = {linkAdded: boolean};
export const imageRendererKey = new PluginKey<ImageRendererState>('imageRenderer');
