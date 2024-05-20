import {Node, NodeType} from 'prosemirror-model';

import {logger} from '../../../logger';
import {UploadSuccessItem} from '../../../utils/upload';
import {imageNodeName} from '../../markdown';
import {ImgSizeAttr} from '../../specs';

import {IMG_MAX_HEIGHT} from './const';

export function isImageNode(node: Node): boolean {
    return node.type.name === imageNodeName;
}

export type CreateImageNodeOptions = {
    needDimmensions: boolean;
};

export const createImageNode =
    (imgType: NodeType, opts: CreateImageNodeOptions) =>
    async ({result, file}: UploadSuccessItem) => {
        const attrs: Record<string, string> = {
            [ImgSizeAttr.Src]: result.url,
            [ImgSizeAttr.Alt]: result.name ?? file.name,
        };
        if (opts.needDimmensions) {
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

export function getImageSize(img: HTMLImageElement): {
    [ImgSizeAttr.Width]?: string;
    [ImgSizeAttr.Height]?: string;
} {
    return {height: String(Math.min(IMG_MAX_HEIGHT, img.height))};
}
