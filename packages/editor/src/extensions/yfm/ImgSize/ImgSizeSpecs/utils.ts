import type {ImageToMarkdownParams} from '../../../markdown/Image/ImageSpecs/utils';

import type {ImgSizeAttr} from './const';

export {imageToMarkdown} from '../../../markdown/Image/ImageSpecs/utils';

type RenderImageExtra = NonNullable<ImageToMarkdownParams['renderExtra']>;

export const renderImgSizeExtra: RenderImageExtra = (_state, node): string => {
    const {width, height} = node.attrs as {
        [ImgSizeAttr.Width]: string | null;
        [ImgSizeAttr.Height]: string | null;
    };
    return width || height ? ` =${width || ''}x${height || ''}` : '';
};
