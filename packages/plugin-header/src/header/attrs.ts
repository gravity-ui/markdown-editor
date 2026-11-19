import {cn} from '@bem-react/classname';

import type {AttrGetter} from '../utils';

import {
    type HeaderBackground,
    headerBackground,
    headerBackgroundValues,
    toCssUrl,
} from './background';
import {type HeaderLayout, headerLayout, headerLayoutValues} from './layout';
import {type HeaderDimensions, headerClassName, headerDimensions} from './model';

const b = cn(headerClassName);

type HeaderAttrsInput = Partial<
    Record<keyof HeaderDimensions | keyof HeaderLayout | keyof HeaderBackground, unknown>
>;

/** The rendered form of a banner: its classes, the CSS address of its image, and its data attributes. */
export type HeaderRender = {
    className: string;
    /** The image as a CSS `url()`, or `null` without a safe image. */
    backgroundImage: string | null;
    data: Record<string, string>;
};

/** Modifiers and the image render the block; data attributes carry its options for parsing. */
export function headerRender(attrs: HeaderAttrsInput): HeaderRender {
    const dimensions = headerDimensions(attrs);
    const layout = headerLayoutValues(headerLayout(attrs));
    const background = headerBackground(attrs);
    const backgroundImage = background['bg-image'] && toCssUrl(background['bg-image']);
    const theme = background['bg-image-theme'];
    const data: Record<string, string> = {
        'data-height': dimensions.height,
        'data-width': dimensions.width,
    };
    for (const [name, value] of Object.entries(layout)) data[`data-${name}`] = value;
    for (const [name, value] of Object.entries(headerBackgroundValues(background))) {
        data[`data-${name}`] = value;
    }
    return {
        className: b(
            {
                ...dimensions,
                ...layout,
                'bg-color': background['bg-color'] ?? undefined,
                'bg-image': Boolean(backgroundImage),
                'bg-image-blur': background['bg-image-blur'],
            },
            theme === 'system' ? undefined : ['g-root', `g-root_theme_${theme}`],
        ),
        backgroundImage,
        data,
    };
}

/**
 * The HTML attributes of `headerRender`.
 * The image address is in the `style`: there a relative address resolves against the page,
 * and in a custom property used by the stylesheet it resolves against the stylesheet.
 */
export function headerAttrs(attrs: HeaderAttrsInput): Record<string, string> {
    const {className, backgroundImage, data} = headerRender(attrs);
    const result: Record<string, string> = {class: className, ...data};
    if (backgroundImage) result.style = `background-image:${backgroundImage}`;
    return result;
}

export function headerDimensionsFromAttrs(getAttr: AttrGetter) {
    return headerDimensions({height: getAttr('data-height'), width: getAttr('data-width')});
}

export function headerLayoutFromAttrs(getAttr: AttrGetter) {
    return headerLayout({align: getAttr('data-align'), vertical: getAttr('data-vertical')});
}

export function headerBackgroundFromAttrs(getAttr: AttrGetter) {
    return headerBackground({
        'bg-color': getAttr('data-bg-color'),
        'bg-image': getAttr('data-bg-image'),
        'bg-image-theme': getAttr('data-bg-image-theme'),
        'bg-image-blur': getAttr('data-bg-image-blur'),
    });
}
