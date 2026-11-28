import {bannerTitle} from '@gravity-ui/markdown-plugin-banner';

import {blockToolbarPopup, blockTooltip} from '../../../../components/BlockToolbar';
import {bannerAlignPlacement} from '../../../../utils/placement';
import {bannerTitleNodeType} from '../../BannerTitleSpecs';

import {BannerTitleToolbar} from './BannerTitleToolbar';

export const bannerTitleTooltip = () =>
    blockTooltip({
        idPrefix: 'banner-title-tooltip',
        nodeType: bannerTitleNodeType,
        placement: bannerAlignPlacement,
        popupClassName: blockToolbarPopup(true),
        content: (view, {node, pos}) => (
            <BannerTitleToolbar view={view} pos={pos} {...bannerTitle(node.attrs)} />
        ),
    });
