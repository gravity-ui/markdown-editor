import type {Middleware, Placement} from '@floating-ui/react';
import type {EditorState} from '@gravity-ui/markdown-editor/pm/state';
import {type BannerAlign, bannerLayout} from '@gravity-ui/markdown-plugin-banner';
import type {PopupPlacement} from '@gravity-ui/uikit';

import {bannerNodeType} from '../extensions/Banner/BannerSpecs';
import {selectedBannerImage} from '../extensions/BannerImage/commands';
import {findDepth} from '../plugins/SelectionInsidePlugin';

const bannerAlign = (state: EditorState, pos: number): BannerAlign => {
    const $pos = state.doc.resolve(pos);
    const depth = findDepth($pos, bannerNodeType(state.schema));
    return depth ? bannerLayout($pos.node(depth).attrs).align : 'left';
};

const alignPlacements: Record<BannerAlign, PopupPlacement> = {
    left: ['top-start', 'bottom-start'],
    center: ['top', 'bottom'],
    right: ['top-end', 'bottom-end'],
};

export const bannerAlignPlacement = (state: EditorState, pos: number) =>
    alignPlacements[bannerAlign(state, pos)];

const belowBanner: PopupPlacement = ['bottom', 'top'];
const belowBannerOnly: PopupPlacement = ['bottom'];

export const bannerPlacement: (state: EditorState, pos: number) => PopupPlacement = (state) =>
    selectedBannerImage(state) ? belowBannerOnly : belowBanner;

const startImagePlacement: Placement[] = ['bottom-start', 'bottom-end', 'top-start', 'top-end'];
const endImagePlacement: Placement[] = ['bottom-end', 'bottom-start', 'top-end', 'top-start'];

export const bannerImagePlacement = (state: EditorState, pos: number) =>
    bannerAlign(state, pos) === 'right' ? startImagePlacement : endImagePlacement;

const POPUP_GAP = 4;

export const belowBlockToolbar = (
    block: () => Element | null | undefined,
    toolbar: () => HTMLElement | null | undefined,
): Middleware => ({
    name: 'belowBlockToolbar',
    fn({x, y, placement, rects, elements}) {
        const blockElement = block();
        const toolbarElement = toolbar();
        if (!blockElement || !toolbarElement || !placement.startsWith('bottom')) return {};
        const anchor = elements.reference.getBoundingClientRect();
        const blockRect = blockElement.getBoundingClientRect();
        const {offsetWidth: width, offsetHeight: height} = toolbarElement;
        const left = blockRect.x + (blockRect.width - width) / 2 + rects.reference.x - anchor.x;
        const bottom = blockRect.bottom + POPUP_GAP + height + rects.reference.y - anchor.y;
        const apart =
            x >= left + width ||
            x + rects.floating.width <= left ||
            y + rects.floating.height <= bottom - height ||
            y >= bottom + POPUP_GAP;
        return apart ? {} : {y: bottom + POPUP_GAP};
    },
});
