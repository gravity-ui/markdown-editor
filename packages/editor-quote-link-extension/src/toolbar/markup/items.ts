import type {ToolbarDataType, ToolbarItem, ToolbarItemMarkup} from '@gravity-ui/markdown-editor';

import {insertBlockquoteLink} from '../../markup/commands/insertBlockquoteLink';
import {quoteLinkItemView} from '../view/items';

export const quoteLinkItemMarkup: ToolbarItemMarkup = {
    exec: (e) => insertBlockquoteLink(e.cm),
    isActive: () => false,
    isEnable: () => true,
};

export const toolbarQuoteLinkItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'wysiwyg'> = {
    view: quoteLinkItemView,
    markup: quoteLinkItemMarkup,
};
