import {ImsizeAttr} from '@diplodoc/transform/lib/plugins/imsize/const.js';

import {ImageAttr} from '../../../markdown/Image/ImageSpecs/const';

export {imageNodeName} from '../../../markdown/Image/ImageSpecs/const';

export const ImgSizeAttr = {
    ...ImageAttr,
    Width: ImsizeAttr.Width,
    Height: ImsizeAttr.Height,
    Id: 'id',
} as const;
