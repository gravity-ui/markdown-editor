import {Node, NodeType} from 'prosemirror-model';

import {logger} from '../../../logger';
import {UploadSuccessItem, getProportionalSize} from '../../../utils';
import {imageNodeName} from '../../markdown';
import {ImgSizeAttr} from '../../specs';

import {IMG_MAX_HEIGHT} from './const';

export function isImageNode(node: Node): boolean {
    return node.type.name === imageNodeName;
}

export type CreateImageNodeOptions = {
    needDimensions: boolean;
};

export const createImageNode =
    (imgType: NodeType, opts: CreateImageNodeOptions) =>
    async ({result, file}: UploadSuccessItem) => {
        const attrs: Record<string, string> = {
            [ImgSizeAttr.Src]: result.url,
            [ImgSizeAttr.Alt]: result.name ?? file.name,
        };
        if (opts.needDimensions) {
            try {
                const sizes = await loadImage(file).then(getImageSize);
                Object.assign(attrs, sizes);
            } catch (err) {
                logger.error(err);
            }
        }
        return imgType.create(attrs);
    };

export async function loadImage(imgFile: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(imgFile);
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = (_e, _s, _l, _c, error) => reject(error);
    });
}

export function getImageSize({width, height}: HTMLImageElement): {
    [ImgSizeAttr.Width]?: string;
    [ImgSizeAttr.Height]?: string;
} {
    const size = getProportionalSize({
        width,
        height,
        imgMaxHeight: IMG_MAX_HEIGHT,
    });
    return {width: String(size.width), height: String(size.height)};
}
