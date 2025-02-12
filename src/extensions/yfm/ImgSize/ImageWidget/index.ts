import type {Action, ExtensionAuto} from '../../../../core';
import type {FileUploadHandler} from '../../../../utils/upload';

import {addImageWidget} from './actions';
import type {ImageWidgetDescriptorOpts} from './widget';

const addImageWidgetAction = 'addImageWidget';

export type ImageWidgetOptions = Pick<
    ImageWidgetDescriptorOpts,
    'needToSetDimensionsForUploadedImages'
> & {
    imageUploadHandler?: FileUploadHandler;
};

export const ImageWidget: ExtensionAuto<ImageWidgetOptions> = (builder, opts) => {
    builder.addAction(addImageWidgetAction, (deps) =>
        addImageWidget(deps, {
            uploadImages: opts.imageUploadHandler,
            needToSetDimensionsForUploadedImages: opts.needToSetDimensionsForUploadedImages,
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
