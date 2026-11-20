import {includes, valuesOtherThan} from '../utils';

export const headerAligns = ['left', 'center', 'right'] as const;
export const headerVerticals = ['top', 'center', 'bottom'] as const;
export type HeaderAlign = (typeof headerAligns)[number];
export type HeaderVertical = (typeof headerVerticals)[number];

/** The horizontal alignment of the text and the vertical position of the content in the banner. */
export type HeaderLayout = {align: HeaderAlign; vertical: HeaderVertical};

export const headerLayoutDefaults: Readonly<HeaderLayout> = {align: 'left', vertical: 'center'};

export function headerLayout(attrs: {align?: unknown; vertical?: unknown}): HeaderLayout {
    return {
        align: includes(headerAligns, attrs.align) ? attrs.align : headerLayoutDefaults.align,
        vertical: includes(headerVerticals, attrs.vertical)
            ? attrs.vertical
            : headerLayoutDefaults.vertical,
    };
}

/** Values other than the defaults, as attribute strings. */
export function headerLayoutValues(
    layout: HeaderLayout,
): Partial<Record<keyof HeaderLayout, string>> {
    return valuesOtherThan(layout, headerLayoutDefaults);
}
