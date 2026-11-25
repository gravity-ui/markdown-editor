import {cn} from '@bem-react/classname';

import type {AttrGetter} from '../utils';

import {type BannerTitle, bannerTitleClassName, bannerTitleDefaults} from './const';
import {bannerTitle, bannerTitleValues} from './utils';

const b = cn(bannerTitleClassName);

export function bannerTitleAttrs(attrs: {size?: unknown; color?: unknown}): Record<string, string> {
    const title = bannerTitle(attrs);
    const {size, color} = title;
    const result: Record<string, string> = {
        class: b({
            size: String(size),
            color: color === bannerTitleDefaults.color ? undefined : color,
        }),
        role: 'heading',
        'aria-level': String(size),
    };
    for (const [name, value] of Object.entries(bannerTitleValues(title))) {
        result[`data-${name}`] = value;
    }
    return result;
}

export function bannerTitleFromAttrs(getAttr: AttrGetter): BannerTitle {
    return bannerTitle({size: getAttr('data-size'), color: getAttr('data-color')});
}
