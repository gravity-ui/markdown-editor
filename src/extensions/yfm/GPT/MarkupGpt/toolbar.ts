import {MToolbarSingleItemData} from '../../../../bundle/config/markup';
import {GPTIcon} from '../../../../icons';
import {ToolbarDataType} from '../../../../toolbar';
import {gptHotKeys} from '../constants';

import {showMarkupGptExample} from './commands';

export const mGptExampleToolbarItem: MToolbarSingleItemData = {
    id: 'react-popup-example',
    type: ToolbarDataType.SingleButton,
    hotkey: gptHotKeys.openGptKeyTooltip,
    title: 'Help with text',
    icon: {data: GPTIcon},
    exec: (e) => showMarkupGptExample(e.cm),
    isActive: () => false,
    isEnable: () => true,
};
