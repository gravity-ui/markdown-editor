import type {Action, ExtensionAuto} from '../../../core';

import {ImageSpecs, imageType} from './ImageSpecs';
import {AddImageAttrs, addImage} from './actions';
import {addImageAction} from './const';

export {imageNodeName, imageType, ImageAttr} from './ImageSpecs';
/** @deprecated Use `imageType` instead */
export const imgType = imageType;
export type {AddImageAttrs} from './actions';

export const Image: ExtensionAuto = (builder) => {
    builder.use(ImageSpecs);

    builder.addAction(addImageAction, ({schema}) => addImage(schema));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [addImageAction]: Action<AddImageAttrs>;
        }
    }
}
