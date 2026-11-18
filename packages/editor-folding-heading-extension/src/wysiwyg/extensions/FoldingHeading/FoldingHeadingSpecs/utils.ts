import type {SerializerNodeToken} from '@gravity-ui/markdown-editor/core';
import {YfmHeadingAttr} from '@gravity-ui/markdown-editor/specs';

import {FoldingHeadingAttr} from './const';

export const renderFoldingHeadingMarkup: SerializerNodeToken = (state, node) => {
    const folding = node.attrs[FoldingHeadingAttr.Folding];
    const level = node.attrs[YfmHeadingAttr.Level];

    state.write(state.repeat('#', level) + (typeof folding === 'boolean' ? '+' : '') + ' ');
};
