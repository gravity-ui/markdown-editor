import {headerTitle} from '@gravity-ui/markdown-plugin-header';

import {blockTooltip} from '../../../blockToolbar';
import {headerAlignPlacement} from '../../../placement';
import {headerTitleNodeType} from '../../HeaderTitleSpecs';

import {HeaderTitleToolbar} from './HeaderTitleToolbar';

export const headerTitleTooltip = () =>
    blockTooltip({
        idPrefix: 'header-title-tooltip',
        nodeType: headerTitleNodeType,
        placement: headerAlignPlacement,
        content: (view, {node, pos}) => (
            <HeaderTitleToolbar view={view} pos={pos} {...headerTitle(node.attrs)} />
        ),
    });
