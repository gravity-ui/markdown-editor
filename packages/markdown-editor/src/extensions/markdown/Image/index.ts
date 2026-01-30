import type {Action, ExtensionAuto} from '../../../core';
import {isFunction} from '../../../lodash';

import {ImageSpecs} from './ImageSpecs';
import {type AddImageAttrs, addImage} from './actions';
import {addImageAction} from './const';
import {type ImageUrlPasteOptions, imageUrlPaste} from './imageUrlPaste';

export {imageNodeName, imageType, ImageAttr} from './ImageSpecs';
export type {AddImageAttrs} from './actions';

export type ImageOptions = ImageUrlPasteOptions;

export const Image: ExtensionAuto<ImageOptions> = (builder, opts) => {
    builder.use(ImageSpecs);

    builder.addAction(addImageAction, ({schema}) => addImage(schema));

    if (isFunction(opts?.parseInsertedUrlAsImage)) {
        builder.use(imageUrlPaste, {
            parseInsertedUrlAsImage: opts.parseInsertedUrlAsImage,
        });
    }
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [addImageAction]: Action<AddImageAttrs>;
        }
    }
}
