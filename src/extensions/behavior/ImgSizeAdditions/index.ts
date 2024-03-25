import {Plugin} from 'prosemirror-state';

import {ExtensionAuto} from '../../../core';
import {imageNodeName} from '../../../extensions/markdown';
import {reactNodeViewFactory} from '../../../react-utils/react-node-view';
import type {FileUploadHandler} from '../../../utils/upload';

import {ImagePaste} from './ImagePaste';
import {ImageWidget} from './ImageWidget';
import {ImageNodeView, cnImgSizeNodeView} from './NodeView/NodeView';
import {imageRendererKey} from './const';

export type ImgSizeAdditionsOptions = {
    imageUploadHandler?: FileUploadHandler;
    /**
     * If we need to set dimensions for uploaded images
     *
     * @default false
     */
    needToSetDimensionsForUploadedImages?: boolean;
};

export const ImgSizeAdditions: ExtensionAuto<ImgSizeAdditionsOptions> = (builder, opts) => {
    builder.use(ImageWidget, {
        imageUploadHandler: opts.imageUploadHandler,
        needToSetDimensionsForUploadedImages: Boolean(opts.needToSetDimensionsForUploadedImages),
    });

    if (opts.imageUploadHandler) {
        builder.use(ImagePaste, {
            imageUploadHandler: opts.imageUploadHandler,
            needDimmensions: Boolean(opts.needToSetDimensionsForUploadedImages),
        });
    }
    builder.addPlugin(
        (deps) =>
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
            }),
    );
};
