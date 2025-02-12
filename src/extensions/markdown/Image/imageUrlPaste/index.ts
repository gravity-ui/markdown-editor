import {Plugin} from 'prosemirror-state';

import type {ParseInsertedUrlAsImage} from '../../../../bundle';
import type {ExtensionAuto} from '../../../../core';
import {DataTransferType} from '../../../behavior/Clipboard/utils';
import {imageType} from '../ImageSpecs';

export type ImageUrlPasteOptions = {
    /**
     * The function, used to determine if the pasted text is the image url and should be inserted as an image
     */
    parseInsertedUrlAsImage?: ParseInsertedUrlAsImage;
};

export const imageUrlPaste: ExtensionAuto<ImageUrlPasteOptions> = (builder, opts) => {
    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    handleDOMEvents: {
                        paste(view, e) {
                            if (
                                !opts.parseInsertedUrlAsImage ||
                                !e.clipboardData ||
                                view.state.selection.$from.parent.type.spec.code
                            )
                                return false;

                            const {imageUrl, title} =
                                opts.parseInsertedUrlAsImage(
                                    e.clipboardData.getData(DataTransferType.Text) ?? '',
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
                        },
                    },
                },
            }),
        builder.Priority.High,
    );
};
