import type {Node} from '#pm/model';

import type {ImgSizeAttr} from './const';

export function renderImgSizeExtra(_state: unknown, node: Node): string {
    const {width, height} = node.attrs as {
        [ImgSizeAttr.Width]: string | null;
        [ImgSizeAttr.Height]: string | null;
    };
    return width || height ? ` =${width || ''}x${height || ''}` : '';
}
