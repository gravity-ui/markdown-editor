import {cn} from '@bem-react/classname';

import type {WToolbarSingleItemData} from '../../../bundle/toolbar/types';
import {i18n} from '../../../i18n/gpt/extension';
import gptIcon from '../../../icons/GPT';
import {ToolbarDataType} from '../../../toolbar/types';

import {gptHotKeys} from './constants';

export const cnGptButton = cn('gpt-button');

export type GetWGptItemData = Pick<
    WToolbarSingleItemData,
    'title' | 'hotkey' | 'icon' | 'className'
>;

export const wGptItemData: WToolbarSingleItemData = {
    type: ToolbarDataType.SingleButton,
    id: 'gpt',
    title: () => `${i18n('help-with-text')}`,
    hotkey: gptHotKeys.openGptKeyTooltip,
    icon: {data: gptIcon},
    hintWhenDisabled: false,
    exec: (actionsStorage) => actionsStorage.actions.addGptWidget.run({}),
    isActive: (actionsStorage) => actionsStorage.actions.addGptWidget.isActive(),
    isEnable: (actionsStorage) => actionsStorage.actions.addGptWidget.isEnable(),
    className: cnGptButton(),
};

export function getWGptItemData(params: Partial<GetWGptItemData>) {
    return {
        ...wGptItemData,
        ...params,
    };
}
