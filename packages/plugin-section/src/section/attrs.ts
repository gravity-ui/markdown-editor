import {cn} from '@bem-react/classname';

import {
    sectionBackground,
    sectionClassName,
    sectionColumnClassName,
    sectionColumnSize,
    sectionSettings,
} from './model';

const section = cn(sectionClassName);
const column = cn(sectionColumnClassName);

export function sectionAttrs(attrs: {padding?: unknown; gap?: unknown; rounded?: unknown}) {
    const {padding, gap, rounded} = sectionSettings(attrs);
    return {
        class: section({
            padded: padding ?? undefined,
            gap: gap === '0.5' ? 'half' : gap,
            rounded: rounded ?? undefined,
        }),
        'data-padding': padding ?? '',
        'data-gap': gap,
        'data-rounded': rounded ?? '',
    };
}

export function sectionColumnAttrs(attrs: {size?: unknown; background?: unknown}) {
    const size = String(sectionColumnSize(attrs.size));
    const background = sectionBackground(attrs.background);
    return {
        class: column({size, background}),
        'data-size': size,
        'data-background': background,
    };
}
