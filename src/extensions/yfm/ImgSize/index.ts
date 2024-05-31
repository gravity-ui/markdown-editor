import type {Action, ExtensionAuto} from '../../../core';
import type {FileUploadHandler} from '../../../utils';

import {ImagePaste} from './ImagePaste';
import {ImageWidget} from './ImageWidget';
import {ImgSizeSpecs, ImgSizeSpecsOptions} from './ImgSizeSpecs';
import {AddImageAttrs, addImage} from './actions';
import {addImageAction} from './const';
import {imgSizeNodeViewPlugin} from './plugins/ImgSizeNodeView';

export type ImgSizeOptions = ImgSizeSpecsOptions & {
    imageUploadHandler?: FileUploadHandler;
    /**
     * If we need to set dimensions for uploaded images
     *
     * @default false
     */
    needToSetDimensionsForUploadedImages?: boolean;
};

export const ImgSize: ExtensionAuto<ImgSizeOptions> = (builder, opts) => {
    builder.use(ImgSizeSpecs, opts);

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

    builder.addAction(addImageAction, ({schema}) => addImage(schema));

    builder.addPlugin(imgSizeNodeViewPlugin);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            // @ts-expect-error
            [addImageAction]: Action<AddImageAttrs>;
        }
    }
}
