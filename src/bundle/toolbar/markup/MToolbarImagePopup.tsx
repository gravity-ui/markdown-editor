import React, {RefObject} from 'react';

import isNumber from 'is-number';

import {IMG_MAX_HEIGHT, ImageItem, getImageDimensions, insertImages} from '../../../markup';
import type {CodeEditor} from '../../../markup';
import type {ToolbarBaseProps} from '../../../toolbar';
import type {UploadSuccessItem} from '../../../utils';
import {ToolbarImagePopup} from '../custom/ToolbarImagePopup';

import {useMarkupToolbarContext} from './context';

const noop = (err: unknown) => {
    console.error(err);
};

export type MToolbarImagePopupProps = ToolbarBaseProps<CodeEditor> & {
    hide: () => void;
    anchorRef: RefObject<HTMLElement>;
};

export const MToolbarImagePopup: React.FC<MToolbarImagePopupProps> = ({
    focus,
    onClick,
    hide,
    anchorRef,
    editor,
    className,
}) => {
    const {uploadHandler, needToSetDimensionsForUploadedImages} = useMarkupToolbarContext();

    return (
        <ToolbarImagePopup
            hide={hide}
            anchorRef={anchorRef}
            focus={focus}
            onClick={onClick}
            className={className}
            onSubmit={({url, name, alt, width, height}) => {
                insertImages([
                    {
                        url,
                        alt,
                        title: name,
                        width: isNumber(width) ? String(width) : '',
                        height: isNumber(height) ? String(height) : '',
                    },
                ])(editor.cm);
            }}
            uploadImages={uploadHandler}
            onSuccessUpload={async (res) => {
                const images = await toImageItems(
                    res.success,
                    Boolean(needToSetDimensionsForUploadedImages),
                );
                insertImages(images)(editor.cm);
            }}
        />
    );
};

async function toImageItems(
    items: readonly UploadSuccessItem[],
    withDimensions: boolean,
): Promise<ImageItem[]> {
    const imgItems: ImageItem[] = [];

    await Promise.all(
        items.map<Promise<void>>(({result, file}) => {
            const imgItem: ImageItem = {url: result.url, alt: result.name ?? file.name};
            imgItems.push(imgItem);

            if (withDimensions) {
                return getImageDimensions(file).then(({height}) => {
                    imgItem.height = String(Math.min(height, IMG_MAX_HEIGHT));
                }, noop);
            }
            return Promise.resolve();
        }),
    );

    return imgItems;
}
