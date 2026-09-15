import {LayoutHeader} from '@gravity-ui/icons';

import {i18n} from 'src/i18n/header';
import type {WToolbarSingleItemData} from 'src/bundle/toolbar/types';
import {ToolbarDataType} from 'src/toolbar';

/**
 * Айтем для тулбара и меню `/`. Живёт в расширении, а не в общем конфиге ядра: подключает его
 * приложение, поэтому редактор без Header ничего про него не знает. Гейт через `?.` — чтобы
 * один и тот же конфиг работал и когда расширение не подключено.
 */
export const wHeaderItemData: WToolbarSingleItemData = {
    id: 'header',
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'insert'),
    icon: {data: LayoutHeader},
    exec: (e) => e.actions.toHeader?.run(),
    isActive: (e) => e.actions.toHeader?.isActive() ?? false,
    isEnable: (e) => e.actions.toHeader?.isEnable() ?? false,
};
