import {HandPointUp, SquareArticle} from '@gravity-ui/icons';
import {ToolbarDataType, type ToolbarItemView} from '@gravity-ui/markdown-editor';

import {i18n} from '../../i18n';

export const headerItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'insert'),
    icon: {data: SquareArticle},
};

export const buttonItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'button-insert'),
    icon: {data: HandPointUp},
};
