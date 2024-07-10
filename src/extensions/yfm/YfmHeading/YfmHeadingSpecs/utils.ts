import type {TagParseRule} from 'prosemirror-model';

import {HeadingLevel, YfmHeadingAttr} from '../const';
export {hType, hasParentHeading, headingRule} from '../../../markdown/Heading/utils';
// const slug = require('slugify');

export const getNodeAttrs =
    (level: HeadingLevel): TagParseRule['getAttrs'] =>
    (node) => ({
        [YfmHeadingAttr.Level]: level,
        [YfmHeadingAttr.Id]: node.getAttribute('id') || '',
        [YfmHeadingAttr.Folding]: node.hasAttribute(`data-${YfmHeadingAttr.Folding}`),
    });

// export const slugify = (str: string) =>
//     // same config as in yfm-transform
//     // https://github.com/yandex-cloud/yfm-transform/blob/master/lib/plugins/anchors/index.js#L97-L100
//     slug(str, {
//         lower: true,
//         remove: /[*+~.()'"!:@]/g,
//     });
