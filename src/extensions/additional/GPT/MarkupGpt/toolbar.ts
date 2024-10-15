import {MToolbarSingleItemData} from '../../../../bundle/config/markup';
import {i18n} from '../../../../i18n/gpt/extension';
import {GPTIcon} from '../../../../icons';
import {ToolbarDataType} from '../../../../toolbar';
import {gptHotKeys} from '../constants';

import {showMarkupGpt} from './commands';

export const mGptToolbarItem: MToolbarSingleItemData = {
    id: 'gpt',
    type: ToolbarDataType.SingleButton,
    hotkey: gptHotKeys.openGptKeyTooltip,
    title: () => `${i18n('help-with-text')}`,
    icon: {data: GPTIcon},
    exec: (e) => showMarkupGpt(e.cm),
    isActive: () => false,
    isEnable: () => true,
};
