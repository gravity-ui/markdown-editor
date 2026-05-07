import {Facet} from '@codemirror/state';

import type {FileUploadHandler} from '../../utils/upload';

export type {FileUploadHandler};

export const FileUploadHandlerFacet = Facet.define<
    {fn: FileUploadHandler; imageWithDimensions?: boolean; enableNewImageSizeCalculation?: boolean},
    {fn: FileUploadHandler; imageWithDimensions?: boolean; enableNewImageSizeCalculation?: boolean}
>({
    combine: (value) => value[0],
    static: true,
});
