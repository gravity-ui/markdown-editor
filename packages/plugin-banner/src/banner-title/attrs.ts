import {cn} from '@bem-react/classname';

import type {AttrGetter} from '../utils';

import {
    type BannerTitleModel,
    bannerTitleClassName,
    bannerTitleDefaults,
    bannerTitleModel,
    bannerTitleValues,
} from './model';

const b = cn(bannerTitleClassName);

/** Modifiers style the title; data attributes carry the size and the color other than the defaults. */
export function bannerTitleAttrs(attrs: {size?: unknown; color?: unknown}): Record<string, string> {
    const title = bannerTitleModel(attrs);
    const {size, color} = title;
    const result: Record<string, string> = {
        class: b({
            size: String(size),
            color: color === bannerTitleDefaults.color ? undefined : color,
        }),
    };
    for (const [name, value] of Object.entries(bannerTitleValues(title))) {
        result[`data-${name}`] = value;
    }
    return result;
}

export function bannerTitleFromAttrs(getAttr: AttrGetter): BannerTitleModel {
    return bannerTitleModel({size: getAttr('data-size'), color: getAttr('data-color')});
}
