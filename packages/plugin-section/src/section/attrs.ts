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

export function sectionAttrs(attrs: {padding?: unknown; gap?: unknown}) {
    const {padding, gap} = sectionSettings(attrs);
    return {
        class: section({padded: padding, gap: gap === '0.5' ? 'half' : gap}),
        'data-padding': String(padding),
        'data-gap': gap,
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
