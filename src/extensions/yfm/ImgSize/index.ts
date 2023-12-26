import type {Action, ExtensionAuto} from '../../../core';

import {ImgSizeSpecs, ImgSizeSpecsOptions} from './ImgSizeSpecs';
import {AddImageAttrs, addImage} from './actions';
import {addImageAction} from './const';

export type ImgSizeOptions = ImgSizeSpecsOptions & {};

export const ImgSize: ExtensionAuto<ImgSizeOptions> = (builder, opts) => {
    builder.use(ImgSizeSpecs, opts);

    builder.addAction(addImageAction, ({schema}) => addImage(schema));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            // @ts-expect-error
            [addImageAction]: Action<AddImageAttrs>;
        }
    }
}
