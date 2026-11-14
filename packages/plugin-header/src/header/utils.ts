import {includes} from '../utils';

import {
    type HeaderDimensions,
    type HeaderLayout,
    headerAligns,
    headerDefaults,
    headerHeights,
    headerLayoutDefaults,
    headerVerticals,
    headerWidths,
} from './const';

export function headerDimensions(attrs: {height?: unknown; width?: unknown}): HeaderDimensions {
    return {
        height: includes(headerHeights, attrs.height) ? attrs.height : headerDefaults.height,
        width: includes(headerWidths, attrs.width) ? attrs.width : headerDefaults.width,
    };
}

export function headerLayout(attrs: {align?: unknown; vertical?: unknown}): HeaderLayout {
    return {
        align: includes(headerAligns, attrs.align) ? attrs.align : headerLayoutDefaults.align,
        vertical: includes(headerVerticals, attrs.vertical)
            ? attrs.vertical
            : headerLayoutDefaults.vertical,
    };
}

/** Values other than the defaults. */
export function headerLayoutValues(layout: HeaderLayout): Partial<HeaderLayout> {
    return {
        ...(layout.align === headerLayoutDefaults.align ? {} : {align: layout.align}),
        ...(layout.vertical === headerLayoutDefaults.vertical ? {} : {vertical: layout.vertical}),
    };
}
