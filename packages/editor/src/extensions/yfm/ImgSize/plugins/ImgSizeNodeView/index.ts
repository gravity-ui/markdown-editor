import {Plugin} from 'prosemirror-state';

import type {ExtensionDeps} from '../../../../../core';
import {reactNodeViewFactory} from '../../../../../react-utils';
import {imageNodeName, imageRendererKey} from '../../const';

import {ImageNodeView, type ImgSizeNodeViewOpts, cnImgSizeNodeView} from './NodeView';

export const imgSizeNodeViewPlugin =
    (opts: ImgSizeNodeViewOpts = {}) =>
    (deps: ExtensionDeps) =>
        new Plugin({
            key: imageRendererKey,
            state: {
                init: () => undefined,
                apply: (tr) => {
                    return tr.getMeta(imageRendererKey);
                },
            },
            props: {
                nodeViews: {
                    [imageNodeName]: reactNodeViewFactory<ImgSizeNodeViewOpts>(ImageNodeView, {
                        isInline: true,
                        reactNodeWrapperCn: cnImgSizeNodeView('wrapper'),
                        extensionOptions: opts,
                    })(deps),
                },
            },
        });
