import {LayoutHeader} from '@gravity-ui/icons';

import type {WToolbarSingleItemData} from 'src/bundle/config/wysiwyg';
import {i18n} from 'src/i18n/header';
import type {ToolbarItemView, ToolbarItemWysiwyg} from 'src/modules/toolbars/types';
import {ToolbarDataType} from 'src/toolbar';

import {headerNodeName} from './HeaderSpecs';

/** Optional actions allow consumers to reuse the toolbar without the extension. */
export const wHeaderItemData: WToolbarSingleItemData = {
    id: headerNodeName,
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'insert'),
    icon: {data: LayoutHeader},
    aliases: ['cover', 'обложка', 'хедер'],
    exec: (e) => e.actions.toHeader?.run(),
    isActive: (e) => e.actions.toHeader?.isActive() ?? false,
    isEnable: (e) => e.actions.toHeader?.isEnable() ?? false,
};

export const headerItemView: ToolbarItemView = {
    title: () => i18n('insert'),
    icon: {data: LayoutHeader},
    aliases: ['cover', 'header'],
};
export const headerItemWysiwyg: ToolbarItemWysiwyg = {
    exec: (editor) => editor.actions.toHeader?.run(),
    isActive: () => false,
    isEnable: (editor) => editor.actions.toHeader?.isEnable() ?? false,
};
