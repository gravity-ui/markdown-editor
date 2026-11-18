import type {ToolbarDataType, ToolbarItem, ToolbarItemWysiwyg} from '@gravity-ui/markdown-editor';

import {quoteLinkItemView} from '../view/items';

export const quoteLinkItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (e) => {
        e.actions.quoteLink.run();
        e.actions.addLinkToQuoteLink.run();
    },
    isActive: (e) => e.actions.quoteLink.isActive(),
    isEnable: (e) => e.actions.quoteLink.isEnable(),
};

export const toolbarQuoteLinkItem: Omit<ToolbarItem<ToolbarDataType.SingleButton>, 'markup'> = {
    view: quoteLinkItemView,
    wysiwyg: quoteLinkItemWysiwyg,
};
