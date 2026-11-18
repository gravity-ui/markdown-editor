import {ArrowChevronRight} from '@gravity-ui/icons';
import {ToolbarDataType, type ToolbarItemView} from '@gravity-ui/markdown-editor';

import {i18n} from '../../i18n';

export const toggleHeadingFoldingItemView: ToolbarItemView = {
    type: ToolbarDataType.SingleButton,
    icon: {data: ArrowChevronRight},
    title: () => i18n('folding-heading'),
    hint: () => i18n('folding-heading__hint'),
};
