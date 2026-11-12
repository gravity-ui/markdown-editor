import {LayoutHeader} from '@gravity-ui/icons';

import type {WToolbarSingleItemData} from 'src/bundle/config/wysiwyg';
import {i18n} from 'src/i18n/header';
import {ToolbarDataType} from 'src/toolbar';

import {headerNodeName} from './HeaderSpecs';

/** Гейт через `?.`: один конфиг тулбара работает и без расширения. */
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
