import {withNaming} from '@bem-react/classname';

import {headerClassName} from './const';
import {headerDimensions} from './dimensions';
import {type HeaderSlotAttrs, type HeaderTitleAttrs, normalizeHeaderTitleAttrs} from './text';

const b = withNaming({e: '__', m: '_'})(headerClassName);

export const headerTitleClassName = b('title');
export const headerContentClassName = b('content');

type GetAttr = (name: string) => string | null | undefined;

export function headerClassNames(attrs: {height?: unknown; width?: unknown}) {
    return b(headerDimensions(attrs));
}

/** Modifiers style the block; data attributes carry its dimensions for parsing. */
export function headerAttrs(attrs: {height?: unknown; width?: unknown}) {
    const dimensions = headerDimensions(attrs);
    return {
        class: b(dimensions),
        'data-height': dimensions.height,
        'data-width': dimensions.width,
    };
}

export function headerDimensionsFromAttrs(getAttr: GetAttr) {
    return headerDimensions({height: getAttr('data-height'), width: getAttr('data-width')});
}

const hiddenAttrs = (hidden: boolean) => (hidden ? {'data-hidden': 'true'} : {});

export function headerTitleAttrs(attrs: {size?: unknown; color?: unknown; hidden?: unknown}) {
    const {size, color} = normalizeHeaderTitleAttrs(attrs);
    const hidden = attrs.hidden === true;
    return {
        class: b('title', {size, color, hidden}),
        'data-size': size,
        'data-color': color,
        ...hiddenAttrs(hidden),
    };
}

export function headerContentAttrs(attrs: {hidden?: unknown}) {
    const hidden = attrs.hidden === true;
    return {class: b('content', {hidden}), ...hiddenAttrs(hidden)};
}

export function headerTitleFromAttrs(getAttr: GetAttr): HeaderTitleAttrs & HeaderSlotAttrs {
    return {
        ...normalizeHeaderTitleAttrs({size: getAttr('data-size'), color: getAttr('data-color')}),
        hidden: getAttr('data-hidden') === 'true',
    };
}

export function headerContentFromAttrs(getAttr: GetAttr): HeaderSlotAttrs {
    return {hidden: getAttr('data-hidden') === 'true'};
}
