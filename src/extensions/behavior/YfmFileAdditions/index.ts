import {ExtensionAuto} from '../../../core';
import {FileUploadHandler} from '../../../utils/upload';

import {YfmFilePaste} from './YfmFilePaste';
import {YfmFileWidget} from './YfmFileWidget';

export type YfmFileAdditionsOptions = {
    fileUploadHandler?: FileUploadHandler;
    needToSetDimensionsForUploadedImages?: boolean;
};

export const YfmFileAdditions: ExtensionAuto<YfmFileAdditionsOptions> = (builder, opts = {}) => {
    builder.use(YfmFileWidget, opts);

    if (opts.fileUploadHandler) {
        builder.use(YfmFilePaste, {
            fileUploadHandler: opts.fileUploadHandler,
            needToSetDimensionsForUploadedImages: Boolean(
                opts.needToSetDimensionsForUploadedImages,
            ),
        });
    }
};
