import {gptHotKeys} from '../../constants';
import {i18n} from '../../i18n/extension';
import gptIcon from '../../icons/GPT';

export const gptItemView = {
    title: () => i18n('help-with-text'),
    hotkey: gptHotKeys.openGptKeyTooltip,
    icon: {data: gptIcon},
};
