import {Fragment, type Node, type Schema, Slice} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';
import {dropPoint} from 'prosemirror-transform';
import type {EditorView} from 'prosemirror-view';

import {type ExtensionAuto, getLoggerFromState} from '../../../../core';
import {isFunction} from '../../../../lodash';
import type {FileUploadHandler, UploadSuccessItem} from '../../../../utils';
import {clipboardUtils} from '../../../behavior/Clipboard';
import {imageType} from '../../../markdown';
import {createImageNode} from '../../ImgSize/utils'; // TODO: remove hard import
import {fileType} from '../YfmFileSpecs';

import {YfmFilesUploadProcessBase} from './upload';

const {isFilesOnly, isFilesFromHtml, isImageFile} = clipboardUtils;

export type YfmFilePasteOptions = {
    fileUploadHandler: FileUploadHandler;
    needToSetDimensionsForUploadedImages: boolean;
};

export const YfmFilePaste: ExtensionAuto<YfmFilePasteOptions> = (builder, opts) => {
    if (!opts || !isFunction(opts.fileUploadHandler))
        throw new Error('YfmFilePaste extension: fileUploadHandler is not a function');

    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    handleDOMEvents: {
                        paste(view, e) {
                            const logger = getLoggerFromState(view.state);
                            const files = getPastedFiles(e.clipboardData);
                            if (files) {
                                e.preventDefault();
                                logger.event({
                                    event: 'paste-files',
                                    plugin: 'yfm-file-paste',
                                    domEvent: 'paste',
                                });
                                new YfmFilesPasteUploadProcess(view, files, {
                                    uploadHandler: opts.fileUploadHandler,
                                    needToSetDimensionsForUploadedImages:
                                        opts.needToSetDimensionsForUploadedImages,
                                }).run();
                                return true;
                            }
                            return false;
                        },
                        drop(view, e) {
                            // handle drop files from device
                            if (view.dragging) return false;

                            const files = getPastedFiles(e.dataTransfer);
                            if (!files) return false;

                            const dropPos =
                                view.posAtCoords({left: e.clientX, top: e.clientY})?.pos ?? -1;
                            if (dropPos === -1) return false;

                            const posToInsert = dropPoint(
                                view.state.doc,
                                dropPos,
                                createFakeFileSlice(view.state.schema),
                            );

                            const logger = getLoggerFromState(view.state);
                            logger.event({
                                event: 'drop-files',
                                plugin: 'yfm-file-paste',
                                domEvent: 'drop',
                                runProcess: posToInsert !== null,
                            });

                            if (posToInsert !== null) {
                                new YfmFilesPasteUploadProcess(view, files, {
                                    pos: posToInsert,
                                    uploadHandler: opts.fileUploadHandler,
                                    needToSetDimensionsForUploadedImages:
                                        opts.needToSetDimensionsForUploadedImages,
                                }).run();
                            }

                            e.preventDefault();
                            return true;
                        },
                    },
                },
            }),
        builder.Priority.Low,
    );
};

function getPastedFiles(data: DataTransfer | null): File[] | null {
    if (!data) return null;
    if (!isFilesOnly(data) && !isFilesFromHtml(data)) return null;
    return Array.from(data.files);
}

function createFakeFileSlice(schema: Schema): Slice {
    return new Slice(
        Fragment.from(
            fileType(schema).create({
                href: 'fake',
                download: 'file',
            }),
        ),
        0,
        0,
    );
}

type YfmFilesPasteUploadProcessOptions = {
    pos?: number;
    uploadHandler: FileUploadHandler;
    needToSetDimensionsForUploadedImages: boolean;
};

class YfmFilesPasteUploadProcess extends YfmFilesUploadProcessBase {
    protected readonly pos?: number;
    protected readonly createImage?;

    constructor(view: EditorView, files: readonly File[], opts: YfmFilesPasteUploadProcessOptions) {
        super(view, files, opts.uploadHandler);

        this.pos = opts.pos;

        const {schema} = this.view.state;
        if (imageType(schema)) {
            this.createImage = createImageNode(
                imageType(schema),
                {
                    needDimensions: opts.needToSetDimensionsForUploadedImages,
                },
                this.logger,
            );
        }
    }

    protected getSkeletonInitPos(): number {
        return this.pos ?? this.view.state.tr.selection.from;
    }

    protected async createPMNode(res: UploadSuccessItem): Promise<Node> {
        return isImageFile(res.file) && this.createImage
            ? this.createImage(res)
            : this.createFile(res);
    }
}
