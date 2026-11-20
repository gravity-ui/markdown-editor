import type {Middleware, Placement} from '@floating-ui/react';

export const headerImagePlacement: Placement[] = [
    'bottom-end',
    'bottom-start',
    'top-end',
    'top-start',
];

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
