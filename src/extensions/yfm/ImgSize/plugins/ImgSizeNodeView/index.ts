import {Plugin} from 'prosemirror-state';

import {ExtensionDeps} from '../../../../../core';
import {reactNodeViewFactory} from '../../../../../react-utils';
import {imageNodeName, imageRendererKey} from '../../const';

import {ImageNodeView, cnImgSizeNodeView} from './NodeView';

export const imgSizeNodeViewPlugin = (deps: ExtensionDeps) =>
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
                [imageNodeName]: reactNodeViewFactory(ImageNodeView, {
                    isInline: true,
                    reactNodeWrapperCn: cnImgSizeNodeView('wrapper'),
                })(deps),
            },
        },
    });
