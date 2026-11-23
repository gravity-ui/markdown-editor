import {CircleInfo} from '@gravity-ui/icons';
import {ToolbarDataType, type ToolbarItemView} from '@gravity-ui/markdown-editor';

import {i18n} from '../../i18n';

export const termItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'title'),
    icon: {data: CircleInfo},
};
