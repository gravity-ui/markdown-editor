import {bannerTitle} from '@gravity-ui/markdown-plugin-banner';

import {blockTooltip} from '../../../../components/BlockToolbar';
import {bannerAlignPlacement} from '../../../../utils/placement';
import {bannerTitleNodeType} from '../../BannerTitleSpecs';

import {BannerTitleToolbar} from './BannerTitleToolbar';

export const bannerTitleTooltip = () =>
    blockTooltip({
        idPrefix: 'banner-title-tooltip',
        nodeType: bannerTitleNodeType,
        placement: bannerAlignPlacement,
        content: (view, {node, pos}) => (
            <BannerTitleToolbar view={view} pos={pos} {...bannerTitle(node.attrs)} />
        ),
    });
