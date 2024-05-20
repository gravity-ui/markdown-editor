import {PluginKey} from 'prosemirror-state';

export {ImgSizeAttr} from './ImgSizeSpecs';
export {imageNodeName, addImageAction} from '../../markdown/Image/const';

export const IMG_MAX_HEIGHT = 600; //px
export type ImageRendererState = {linkAdded: boolean};
export const imageRendererKey = new PluginKey<ImageRendererState>('imageRenderer');
