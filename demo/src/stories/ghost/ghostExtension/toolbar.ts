import {Ghost} from '@gravity-ui/icons';
import {
    ToolbarDataType,
    type ToolbarItemMarkup,
    type ToolbarItemView,
} from '@gravity-ui/markdown-editor';

import {showGhostPopup} from './commands';

export const ghostPopupItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: 'Show ghost',
    icon: {data: Ghost},
};

export const ghostPopupItemMarkup: ToolbarItemMarkup = {
    exec: (e) => showGhostPopup(e.cm),
    isActive: () => false,
    isEnable: () => true,
};
