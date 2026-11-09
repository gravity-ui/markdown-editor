import {headerClassName} from './const';
import {type HeaderDimensions, headerDimensions, headerHeights, headerWidths} from './dimensions';
import {
    type HeaderTitleAttrs,
    headerTextColors,
    headerTitleSizes,
    normalizeHeaderTitleAttrs,
} from './text';

export const headerTitleClassName = `${headerClassName}__title`;
export const headerContentClassName = `${headerClassName}__content`;

const modifier = (name: keyof HeaderDimensions, value: string) =>
    `${headerClassName}_${name}_${value}`;

const titleModifier = (name: keyof HeaderTitleAttrs, value: string) =>
    `${headerTitleClassName}_${name}_${value}`;

const hiddenModifier = (element: string) => `${element}_hidden`;

export function headerClassNames(attrs: {height?: unknown; width?: unknown}) {
    const {height, width} = headerDimensions(attrs);
    return `${headerClassName} ${modifier('height', height)} ${modifier('width', width)}`;
}

export function headerDimensionsFromClassName(className: string) {
    const classes = className.split(/\s+/);
    return headerDimensions({
        height: headerHeights.find((value) => classes.includes(modifier('height', value))),
        width: headerWidths.find((value) => classes.includes(modifier('width', value))),
    });
}

export function headerTitleClassNames(attrs: {size?: unknown; color?: unknown; hidden?: unknown}) {
    const {size, color} = normalizeHeaderTitleAttrs(attrs);
    const classes = [
        headerTitleClassName,
        titleModifier('size', size),
        titleModifier('color', color),
    ];
    if (attrs.hidden === true) classes.push(hiddenModifier(headerTitleClassName));
    return classes.join(' ');
}

export function headerContentClassNames(attrs: {hidden?: unknown}) {
    return attrs.hidden === true
        ? `${headerContentClassName} ${hiddenModifier(headerContentClassName)}`
        : headerContentClassName;
}

export function headerTitleAttrsFromClassName(className: string) {
    const classes = className.split(/\s+/);
    return {
        ...normalizeHeaderTitleAttrs({
            size: headerTitleSizes.find((value) => classes.includes(titleModifier('size', value))),
            color: headerTextColors.find((value) =>
                classes.includes(titleModifier('color', value)),
            ),
        }),
        hidden: classes.includes(hiddenModifier(headerTitleClassName)),
    };
}

export function headerContentAttrsFromClassName(className: string) {
    return {hidden: className.split(/\s+/).includes(hiddenModifier(headerContentClassName))};
}
