import {cn} from '@bem-react/classname';

import {headerClassName} from './const';
import {type HeaderDimensions, headerDimensions, headerHeights, headerWidths} from './dimensions';

const b = cn(headerClassName);

export function headerClassNames(attrs: {height?: unknown; width?: unknown}) {
    return b(headerDimensions(attrs));
}

export function headerDimensionsFromClassName(className: string) {
    const classes = new Set(className.split(/\s+/));
    const hasModifier = (mods: Partial<HeaderDimensions>) =>
        b(mods)
            .split(' ')
            .every((name) => classes.has(name));
    return headerDimensions({
        height: headerHeights.find((height) => hasModifier({height})),
        width: headerWidths.find((width) => hasModifier({width})),
    });
}
