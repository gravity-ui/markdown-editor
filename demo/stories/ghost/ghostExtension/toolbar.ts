import {Ghost} from '@gravity-ui/icons';

import {ToolbarDataType} from '../../../../src';
import {MToolbarSingleItemData} from '../../../../src/bundle/config/markup';

import {showGhostPopup} from './commands';

export const ghostPopupToolbarItem: MToolbarSingleItemData = {
    id: 'ghost',
    type: ToolbarDataType.SingleButton,
    title: 'Show ghost',
    icon: {data: Ghost},
    exec: (e) => showGhostPopup(e.cm),
    isActive: () => false,
    isEnable: () => true,
};
