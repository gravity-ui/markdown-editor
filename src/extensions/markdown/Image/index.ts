import type {Action, ExtensionAuto} from '../../../core';
import {isFunction} from '../../../lodash';

import {ImageSpecs, imageType} from './ImageSpecs';
import {AddImageAttrs, addImage} from './actions';
import {addImageAction} from './const';
import {type ImageUrlPasteOptions, imageUrlPaste} from './imageUrlPaste';

export {imageNodeName, imageType, ImageAttr} from './ImageSpecs';
/** @deprecated Use `imageType` instead */
export const imgType = imageType;
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
