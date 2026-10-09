import type {Action, ExtensionAuto} from '../../../../core';
import type {FileUploadHandler} from '../../../../utils/upload';

import {addImageWidget} from './actions';
import type {RenderImageWidgetFormFn} from './view';
import type {ImageWidgetDescriptorOpts} from './widget';

const addImageWidgetAction = 'addImageWidget';

export type ImageWidgetOptions = Pick<
    ImageWidgetDescriptorOpts,
    'needToSetDimensionsForUploadedImages' | 'enableNewImageSizeCalculation'
> & {
    imageUploadHandler?: FileUploadHandler;
    renderImageWidgetForm?: RenderImageWidgetFormFn;
};

export const ImageWidget: ExtensionAuto<ImageWidgetOptions> = (builder, opts) => {
    builder.addAction(addImageWidgetAction, (deps) =>
        addImageWidget(deps, {
            uploadImages: opts.imageUploadHandler,
            renderImageForm: opts.renderImageWidgetForm,
            needToSetDimensionsForUploadedImages: opts.needToSetDimensionsForUploadedImages,
            enableNewImageSizeCalculation: opts.enableNewImageSizeCalculation,
        }),
    );
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [addImageWidgetAction]: Action;
        }
    }
}
