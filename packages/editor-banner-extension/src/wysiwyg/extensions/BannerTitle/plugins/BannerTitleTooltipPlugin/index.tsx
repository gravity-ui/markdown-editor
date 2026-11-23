import {bannerTitleModel} from '@gravity-ui/markdown-plugin-banner';

import {blockTooltip} from '../../../blockToolbar';
import {bannerTitleNodeType} from '../../BannerTitleSpecs';

import {BannerTitleToolbar} from './BannerTitleToolbar';

export const bannerTitleTooltip = () =>
    blockTooltip({
        idPrefix: 'banner-title-tooltip',
        nodeType: bannerTitleNodeType,
        // Below the title, so the panel never covers the editor toolbar.
        placement: ['bottom-start', 'top-start'],
        content: (view, {node, pos}) => (
            <BannerTitleToolbar view={view} pos={pos} {...bannerTitleModel(node.attrs)} />
        ),
    });
