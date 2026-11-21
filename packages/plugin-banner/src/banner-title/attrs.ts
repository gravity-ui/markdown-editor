import {cn} from '@bem-react/classname';

import {type GetAttr, dataAttrs, fromDataAttrs} from '../utils';

import {type BannerTitle, bannerTitleClassName, bannerTitleDefaults} from './const';
import {bannerTitle, bannerTitleValues} from './utils';

const b = cn(bannerTitleClassName);

export function bannerTitleAttrs(attrs: {size?: unknown; color?: unknown}): Record<string, string> {
    const title = bannerTitle(attrs);
    const {size, color} = title;
    return {
        class: b({
            size: String(size),
            color: color === bannerTitleDefaults.color ? undefined : color,
        }),
        role: 'heading',
        'aria-level': String(size),
        ...dataAttrs(bannerTitleValues(title)),
    };
}

export const bannerTitleFromAttrs = (getAttr: GetAttr): BannerTitle =>
    bannerTitle(fromDataAttrs(getAttr, bannerTitleDefaults));
