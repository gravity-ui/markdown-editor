import {headerClassName} from './const';
import {type HeaderDimensions, headerDimensions, headerHeights, headerWidths} from './dimensions';

const modifier = (name: keyof HeaderDimensions, value: string) =>
    `${headerClassName}_${name}_${value}`;

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
