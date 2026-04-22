import {LayoutHeaderCursor as PageConstructorIcon} from '@gravity-ui/icons';
import {ToolbarDataType, type WToolbarSingleItemData} from '@gravity-ui/markdown-editor';

import {i18n} from './i18n';

export const wYfmPageConstructorItemData: WToolbarSingleItemData = {
    id: 'pageConstructor',
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'page-constructor'),
    icon: {data: PageConstructorIcon},
    exec: (e) => e.actions.createYfmPageConstructor.run(),
    isActive: (e) => e.actions.createYfmPageConstructor.isActive(),
    isEnable: (e) => e.actions.createYfmPageConstructor.isEnable(),
};
