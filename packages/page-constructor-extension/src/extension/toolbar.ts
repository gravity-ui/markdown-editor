import {LayoutHeaderCursor as PageConstructorIcon} from '@gravity-ui/icons';
import {
    ToolbarDataType,
    type ToolbarItemView,
    type ToolbarItemWysiwyg,
    type WToolbarSingleItemData,
} from '@gravity-ui/markdown-editor';

import {i18n} from '../i18n';

export const pageConstructorItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'page-constructor'),
    icon: {data: PageConstructorIcon},
} satisfies ToolbarItemView;

export const pageConstructorItemWysiwyg = {
    exec: (e) => e.actions.createYfmPageConstructor.run(),
    isActive: (e) => e.actions.createYfmPageConstructor.isActive(),
    isEnable: (e) => e.actions.createYfmPageConstructor.isEnable(),
} satisfies ToolbarItemWysiwyg;

export const wYfmPageConstructorItemData: WToolbarSingleItemData = {
    id: 'pageConstructor',
    ...pageConstructorItemView,
    ...pageConstructorItemWysiwyg,
};
