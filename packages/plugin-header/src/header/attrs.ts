import {cn} from '@bem-react/classname';

import {
    type HeaderBackground,
    headerBackground,
    headerBackgroundValues,
    toCssUrl,
} from './background';
import {type HeaderDimensions, type HeaderLayout, headerClassName} from './const';
import {headerDimensions, headerLayout, headerLayoutValues} from './utils';

const b = cn(headerClassName);

type HeaderAttrsInput = Partial<
    Record<keyof HeaderDimensions | keyof HeaderLayout | keyof HeaderBackground, unknown>
>;

/**
 * Modifiers and the `style` render the block; data attributes carry its options for parsing.
 * The alignment and the background are rendered when they differ from the defaults.
 * The image address is in the `style`: there a relative address resolves against the page,
 * and in a custom property used by the stylesheet it resolves against the stylesheet.
 */
export function headerAttrs(attrs: HeaderAttrsInput): Record<string, string> {
    const dimensions = headerDimensions(attrs);
    const layout = headerLayoutValues(headerLayout(attrs));
    const background = headerBackground(attrs);
    const image = background['bg-image'] && toCssUrl(background['bg-image']);
    const theme = background['bg-image-theme'];
    const result: Record<string, string> = {
        class: b(
            {
                ...dimensions,
                ...layout,
                'bg-color': background['bg-color'] ?? undefined,
                'bg-image': Boolean(image),
                'bg-image-blur': background['bg-image-blur'],
            },
            theme === 'system' ? undefined : ['g-root', `g-root_theme_${theme}`],
        ),
        'data-height': dimensions.height,
        'data-width': dimensions.width,
    };
    for (const [name, value] of Object.entries(layout)) {
        result[`data-${name}`] = value;
    }
    for (const [name, value] of Object.entries(headerBackgroundValues(background))) {
        result[`data-${name}`] = value;
    }
    if (image) result.style = `background-image:${image}`;
    return result;
}

type GetAttr = (name: string) => string | null | undefined;

export function headerDimensionsFromAttrs(getAttr: GetAttr) {
    return headerDimensions({height: getAttr('data-height'), width: getAttr('data-width')});
}

export function headerLayoutFromAttrs(getAttr: GetAttr) {
    return headerLayout({align: getAttr('data-align'), vertical: getAttr('data-vertical')});
}

export function headerBackgroundFromAttrs(getAttr: GetAttr) {
    return headerBackground({
        'bg-color': getAttr('data-bg-color'),
        'bg-image': getAttr('data-bg-image'),
        'bg-image-theme': getAttr('data-bg-image-theme'),
        'bg-image-blur': getAttr('data-bg-image-blur'),
    });
}
