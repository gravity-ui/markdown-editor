import {decode as base64ToBuffer} from 'base64-arraybuffer';
import {Fragment, Node, Schema, Slice} from 'prosemirror-model';
import {Plugin} from 'prosemirror-state';
import {dropPoint} from 'prosemirror-transform';

import {ExtensionAuto} from '../../../../core';
import {isFunction} from '../../../../lodash';
import {FileUploadHandler} from '../../../../utils/upload';
import {clipboardUtils} from '../../../behavior/Clipboard';
import {DataTransferType} from '../../../behavior/Clipboard/utils';
import {ImageAttr, ImgSizeAttr, imageType} from '../../../specs';
import {CreateImageNodeOptions, isImageNode} from '../utils';

import {ImagesUploadProcess} from './upload';

const {isFilesFromHtml, isFilesOnly, isImageFile} = clipboardUtils;

export type ImagePasteOptions = Pick<CreateImageNodeOptions, 'needDimmensions'> & {
    imageUploadHandler?: FileUploadHandler;
    /**
     * The function, used to determine if the pasted text is the image url and should be inserted as an image
     */
    parseInsertedUrlAsImage?: (text: string) => {imageUrl: string; title?: string} | null;
};

export const ImagePaste: ExtensionAuto<ImagePasteOptions> = (builder, opts) => {
    const {parseInsertedUrlAsImage, imageUploadHandler} = opts ?? {};

    if (!isFunction(imageUploadHandler ?? parseInsertedUrlAsImage))
        throw new Error(
            `ImagePaste extension: ${
                opts.imageUploadHandler ? 'imageUploadHandler' : 'parseInsertedUrlAsImage'
            } is not a function`,
        );

    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    handleDOMEvents: {
                        paste(view, e) {
                            const files = getPastedImages(e.clipboardData);
                            if (imageUploadHandler && files) {
                                e.preventDefault();
                                new ImagesUploadProcess(
                                    view,
                                    files,
                                    imageUploadHandler,
                                    view.state.tr.selection.from,
                                    opts,
                                ).run();
                                return true;
                            } else if (parseInsertedUrlAsImage) {
                                const {imageUrl, title} =
                                    parseInsertedUrlAsImage(
                                        e.clipboardData?.getData(DataTransferType.Text) ?? '',
                                    ) || {};

                                if (!imageUrl) {
                                    return false;
                                }

                                e.preventDefault();

                                const imageNode = imageType(view.state.schema).create({
                                    src: imageUrl,
                                    alt: title,
                                });

                                const tr = view.state.tr.replaceSelectionWith(imageNode);
                                view.dispatch(tr.scrollIntoView());

                                return true;
                            }

                            return false;
                        },
                        drop(view, e) {
                            if (!imageUploadHandler) {
                                return false;
                            }

                            // handle drop images from device
                            if (view.dragging) return false;

                            const files = getPastedImages(e.dataTransfer);
                            if (!files) return false;

                            const dropPos =
                                view.posAtCoords({left: e.clientX, top: e.clientY})?.pos ?? -1;
                            if (dropPos === -1) return false;

                            const posToInsert = dropPoint(
                                view.state.doc,
                                dropPos,
                                createFakeImageSlice(view.state.schema),
                            );

                            if (posToInsert !== null) {
                                new ImagesUploadProcess(
                                    view,
                                    files,
                                    imageUploadHandler,
                                    posToInsert,
                                    opts,
                                ).run();
                            }

                            e.preventDefault();
                            return true;
                        },
                    },
                    handlePaste(view, _event, slice) {
                        if (!imageUploadHandler) {
                            return false;
                        }

                        const node = sliceSingleNode(slice);
                        if (node && isImageNode(node)) {
                            const imgUrl = node.attrs[ImgSizeAttr.Src];
                            const imgFile = dataUrlToFile(imgUrl, 'image');
                            if (imgFile) {
                                new ImagesUploadProcess(
                                    view,
                                    [imgFile],
                                    imageUploadHandler,
                                    view.state.tr.selection.from,
                                    opts,
                                ).run();
                                return true;
                            }
                        }
                        return false;
                    },
                },
            }),
        builder.Priority.High,
    );
};

function getPastedImages(data: DataTransfer | null): File[] | null {
    if (!data || data.files.length === 0) return null;
    if (!isFilesOnly(data) && !isFilesFromHtml(data)) return null;
    const files = Array.from(data.files);
    return files.every(isImageFile) ? files : null;
}

function createFakeImageSlice(schema: Schema): Slice {
    return new Slice(
        Fragment.from(
            imageType(schema).create({
                [ImageAttr.Src]: 'fake',
                [ImageAttr.Title]: 'image',
            }),
        ),
        0,
        0,
    );
}

// copied from prosemirror-view input.ts
function sliceSingleNode(slice: Slice): Node | null {
    return slice.openStart === 0 && slice.openEnd === 0 && slice.content.childCount === 1
        ? slice.content.firstChild
        : null;
}

function dataUrlToFile(dataUrl: string, filename: string): File | null {
    const [data, base64String] = dataUrl.split(',');
    if (!data || !base64String) return null;
    const mime = data.match(/^data:(.+);base64/)?.[1];
    if (!mime) return null;
    return new File([base64ToBuffer(base64String)], filename, {type: mime});
}
