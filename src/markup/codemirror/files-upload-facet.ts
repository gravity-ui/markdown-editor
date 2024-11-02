import {Facet} from '@codemirror/state';

import type {FileUploadHandler} from '../../utils/upload';

import {FilesUploadPlugin} from './files-upload-plugin';

export type {FileUploadHandler};

export const FileUploadHandlerFacet = Facet.define<
    {fn: FileUploadHandler; imageWithDimensions?: boolean},
    {fn: FileUploadHandler; imageWithDimensions?: boolean}
>({
    enables: FilesUploadPlugin.extension,
    combine: (value) => value[0],
    static: true,
});
