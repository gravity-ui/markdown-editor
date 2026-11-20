import {headerTitle} from '@gravity-ui/markdown-plugin-header';

import {blockTooltip} from '../../../blockToolbar';
import {headerTitleNodeType} from '../../HeaderTitleSpecs';

import {HeaderTitleToolbar} from './HeaderTitleToolbar';

export const headerTitleTooltip = () =>
    blockTooltip({
        idPrefix: 'header-title-tooltip',
        nodeType: headerTitleNodeType,
        // Below the title, so the panel never covers the editor toolbar.
        placement: ['bottom-start', 'top-start'],
        content: (view, {node, pos}) => (
            <HeaderTitleToolbar view={view} pos={pos} {...headerTitle(node.attrs)} />
        ),
    });
