import {ExtensionAuto} from '../../../core';
import {FileUploadHandler} from '../../../utils/upload';

import {YfmFilePaste} from './YfmFilePaste';
import {YfmFileSpecs} from './YfmFileSpecs';
import {YfmFileWidget} from './YfmFileWidget';

import './index.scss';

export type YfmFileOptions = {
    fileUploadHandler?: FileUploadHandler;
    needToSetDimensionsForUploadedImages?: boolean;
};

export const YfmFile: ExtensionAuto<YfmFileOptions> = (builder, opts = {}) => {
    builder.use(YfmFileSpecs, opts);
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
