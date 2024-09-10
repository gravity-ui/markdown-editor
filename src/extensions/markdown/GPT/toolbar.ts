import {cn} from '@bem-react/classname';

import {i18n} from '../../../i18n/gpt/extension';
import gptIcon from '../../../icons/GPT';
import {ToolbarDataType, type WToolbarSingleItemData} from '../../../toolbar';

import {gptHotKeys} from './constants';

export const cnGptButton = cn('gpt-button');

export const wGptToolbarItem: WToolbarSingleItemData = {
    type: ToolbarDataType.SingleButton,
    id: 'inline-comment',
    title: () => `${i18n('help-with-text')}`,
    hotkey: gptHotKeys.openGptKeyTooltip,
    icon: {data: gptIcon},
    disabledPopoverVisible: false,
    exec: (actionsStorage) => actionsStorage.actions.addGptWidget.run({}),
    isActive: (actionsStorage) => actionsStorage.actions.addGptWidget.isActive(),
    isEnable: (actionsStorage) => actionsStorage.actions.addGptWidget.isEnable(),
    className: cnGptButton(),
};
