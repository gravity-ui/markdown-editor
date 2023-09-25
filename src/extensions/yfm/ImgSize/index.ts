import type {Action, ExtensionAuto} from '../../../core';
import {addImageAction} from './const';
import {addImage, AddImageAttrs} from './actions';
import {ImgSizeSpecs, ImgSizeSpecsOptions} from './ImgSizeSpecs';

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
