import {LogoMermaid} from '@gravity-ui/icons';
import {ToolbarDataType, type ToolbarItemView} from '@gravity-ui/markdown-editor';

import {i18n} from '../../i18n';

export const mermaidItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    title: i18n.bind(null, 'insert'),
    icon: {data: LogoMermaid},
};
