import type {Action, ExtensionAuto} from '../../../core';

import {ImagePaste, type ImagePasteOptions} from './ImagePaste';
import {ImageWidget, type ImageWidgetOptions} from './ImageWidget';
import {ImgSizeSpecs, type ImgSizeSpecsOptions} from './ImgSizeSpecs';
import {type AddImageAttrs, addImage} from './actions';
import {addImageAction} from './const';
import {imgSizeNodeViewPlugin} from './plugins/ImgSizeNodeView';

export type ImgSizeOptions = ImgSizeSpecsOptions & {
    /**
     * If we need to set dimensions for uploaded images
     *
     * @default false
     */
    needToSetDimensionsForUploadedImages?: boolean;
} & Pick<
        ImagePasteOptions,
        'imageUploadHandler' | 'parseInsertedUrlAsImage' | 'enableNewImageSizeCalculation'
    > &
    Pick<ImageWidgetOptions, 'renderImageWidgetForm'>;

export const ImgSize: ExtensionAuto<ImgSizeOptions> = (builder, opts) => {
    builder.use(ImgSizeSpecs, opts);

    builder.use(ImageWidget, {
        imageUploadHandler: opts.imageUploadHandler,
        renderImageWidgetForm: opts.renderImageWidgetForm,
        needToSetDimensionsForUploadedImages: Boolean(opts.needToSetDimensionsForUploadedImages),
        enableNewImageSizeCalculation: Boolean(opts.enableNewImageSizeCalculation),
    });

    if (opts.imageUploadHandler || opts.parseInsertedUrlAsImage) {
        builder.use(ImagePaste, {
            imageUploadHandler: opts.imageUploadHandler,
            needDimensions: Boolean(opts.needToSetDimensionsForUploadedImages),
            parseInsertedUrlAsImage: opts.parseInsertedUrlAsImage,
            enableNewImageSizeCalculation: opts.enableNewImageSizeCalculation,
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
