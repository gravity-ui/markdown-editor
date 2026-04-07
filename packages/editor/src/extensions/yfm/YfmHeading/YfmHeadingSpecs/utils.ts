import type {TagParseRule} from 'prosemirror-model';

import type {SerializerNodeToken} from '#core';

import {type HeadingLevel, YfmHeadingAttr} from '../const';
export {hasParentHeading, headingRule} from '../../../markdown/Heading/utils';
export {headingType} from '../../../markdown/Heading/HeadingSpecs';

// const slug = require('slugify');

export const getNodeAttrs =
    (level: HeadingLevel): TagParseRule['getAttrs'] =>
    (node) => ({
        [YfmHeadingAttr.Level]: level,
        [YfmHeadingAttr.Id]: node.getAttribute('id') || '',
        [YfmHeadingAttr.Folding]: getFoldingAttr(node),
    });

function getFoldingAttr(node: HTMLElement): boolean | null {
    const value = node.getAttribute(`data-${YfmHeadingAttr.Folding}`);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
}

// export const slugify = (str: string) =>
//     // same config as in yfm-transform
//     // https://github.com/yandex-cloud/yfm-transform/blob/master/lib/plugins/anchors/index.js#L97-L100
//     slug(str, {
//         lower: true,
//         remove: /[*+~.()'"!:@]/g,
//     });

export const renderYfmHeadingMarkup: SerializerNodeToken = (state, node) => {
    const folding = node.attrs[YfmHeadingAttr.Folding];
    const level = node.attrs[YfmHeadingAttr.Level];

    state.write(state.repeat('#', level) + (typeof folding === 'boolean' ? '+' : '') + ' ');
};

export const renderYfmHeadingAttributes: SerializerNodeToken = (state, node) => {
    const anchor = node.attrs[YfmHeadingAttr.Id];

    if (anchor /*&& anchor !== node.firstChild?.textContent*/) {
        state.write(` {#${anchor}}`);
    }
};
