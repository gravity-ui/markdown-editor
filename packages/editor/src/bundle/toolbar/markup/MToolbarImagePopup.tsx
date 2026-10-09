import {useMemo} from 'react';

import isNumber from 'is-number';

import {IMG_MAX_HEIGHT, type ImageItem, getImageDimensions, insertImages} from '../../../markup';
import type {UploadSuccessItem} from '../../../utils';
import {type ToolbarImagePopuProps, ToolbarImagePopup} from '../custom/ToolbarImagePopup';
import type {MToolbarBaseProps} from '../types';

import {useMarkupToolbarContext} from './context';

const noop = (err: unknown) => {
    console.error(err);
};

export type MToolbarImagePopupProps = MToolbarBaseProps &
    Pick<ToolbarImagePopuProps, 'anchorElement'> & {
        hide: () => void;
    };

export const MToolbarImagePopup: React.FC<MToolbarImagePopupProps> = ({
    focus,
    onClick,
    hide,
    anchorElement,
    editor,
    className,
}) => {
    const {uploadHandler, needToSetDimensionsForUploadedImages} = useMarkupToolbarContext();

    const selectedString = useMemo(() => {
        const {from, to} = editor.cm.state.selection.main;
        return editor.cm.state.doc.sliceString(from, to);
        // we need to calculate the selection only once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ToolbarImagePopup
            imageTitle={selectedString}
            hide={hide}
            anchorElement={anchorElement}
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
