import type {ExtensionAuto} from '../../../core';
import type {FileUploadHandler} from '../../../utils/upload';

import {YfmFilePaste} from './YfmFilePaste';
import {YfmFileSpecs} from './YfmFileSpecs';
import {YfmFileWidget} from './YfmFileWidget';

import '@diplodoc/file-extension/runtime/styles.css';
import './index.scss'; // eslint-disable-line import/order

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
