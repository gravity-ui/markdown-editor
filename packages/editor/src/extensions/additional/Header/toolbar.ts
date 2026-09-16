import {LayoutHeader} from '@gravity-ui/icons';

import type {WToolbarSingleItemData} from 'src/bundle/toolbar/types';
import {i18n} from 'src/i18n/header';
import {ToolbarDataType} from 'src/toolbar';

/** Optional toolbar and slash-menu item. */
export const wHeaderItemData: WToolbarSingleItemData = {
    id: 'header',
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'insert'),
    icon: {data: LayoutHeader},
    exec: (e) => e.actions.toHeader?.run(),
    isActive: (e) => e.actions.toHeader?.isActive() ?? false,
    isEnable: (e) => e.actions.toHeader?.isEnable() ?? false,
};
