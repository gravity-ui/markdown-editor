import React from 'react';

import isNumber from 'is-number';

import {ImageItem, insertImages} from '../../../markup/commands';
import type {CodeEditor} from '../../../markup/editor';
import {ToolbarBaseProps} from '../../../toolbar';
import type {UploadSuccessItem} from '../../../utils/upload';
import {IMG_MAX_HEIGHT} from '../../cm-upload/const';
import {getImageDimensions} from '../../cm-upload/utils';
import {ToolbarImage} from '../custom/ToolbarImage';

import {useMarkupToolbarContext} from './context';

const noop = (err: any) => {
    console.error(err);
};

export type MToolbarImageProps = ToolbarBaseProps<CodeEditor> & {};

export const MToolbarImage: React.FC<MToolbarImageProps> = ({
    focus,
    onClick,
    editor,
    className,
}) => {
    const {uploadHandler, needToSetDimensionsForUploadedImages} = useMarkupToolbarContext();

    return (
        <ToolbarImage
            focus={focus}
            onClick={onClick}
            className={className}
            active={false}
            enable={true}
            onSubmit={({url, name, alt, width, height}) => {
                insertImages(editor.cm, [
                    {
                        url,
                        alt,
                        title: name,
                        width: isNumber(width) ? String(width) : '',
                        height: isNumber(height) ? String(height) : '',
                    },
                ]);
            }}
            uploadImages={uploadHandler}
            onSuccessUpload={async (res) => {
                const images = await toImageItems(
                    res.success,
                    Boolean(needToSetDimensionsForUploadedImages),
                );
                insertImages(editor.cm, images);
            }}
        />
    );
};

async function toImageItems(
    items: readonly UploadSuccessItem[],
    withDimmensions: boolean,
): Promise<ImageItem[]> {
    const imgItems: ImageItem[] = [];

    await Promise.all(
        items.map<Promise<void>>(({result, file}) => {
            const imgItem: ImageItem = {url: result.url, alt: result.name ?? file.name};
            imgItems.push(imgItem);

            if (withDimmensions) {
                return getImageDimensions(file).then(({height}) => {
                    imgItem.height = String(Math.min(height, IMG_MAX_HEIGHT));
                }, noop);
            }
            return Promise.resolve();
        }),
    );

    return imgItems;
}
