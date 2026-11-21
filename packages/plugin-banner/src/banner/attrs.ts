import {cn} from '@bem-react/classname';

import {filesGalleryExcludeAttrs} from '../const';
import {toCssUrl} from '../url';
import {type GetAttr, fromDataAttrs, toDataAttrs} from '../utils';

import {
    type BannerModel,
    bannerBackgroundDefaults,
    bannerClassName,
    bannerLayoutDefaults,
    bannerModelDefaults,
} from './const';
import {
    bannerBackground,
    bannerDimensions,
    bannerLayout,
    bannerLayoutValues,
    bannerModel,
} from './utils';

const b = cn(bannerClassName);

type BannerAttrsInput = Partial<Record<keyof BannerModel, unknown>>;

export function bannerAttrs(attrs: BannerAttrsInput): Record<string, string> {
    const dimensions = bannerDimensions(attrs);
    const layout = bannerLayout(attrs);
    const background = bannerBackground(attrs);
    const image = background['bg-image'] && toCssUrl(background['bg-image']);
    const theme = background['bg-image-theme'];
    return {
        class: b(
            {
                ...dimensions,
                ...bannerLayoutValues(layout),
                'bg-color': background['bg-color'] ?? undefined,
                'bg-image': Boolean(image),
                'bg-image-blur': background['bg-image-blur'],
            },
            theme === 'system' ? undefined : ['g-root', `g-root_theme_${theme}`],
        ),
        ...filesGalleryExcludeAttrs,
        'data-height': dimensions.height,
        'data-width': dimensions.width,
        ...toDataAttrs(layout, bannerLayoutDefaults),
        ...toDataAttrs(background, bannerBackgroundDefaults),
        ...(image ? {style: `background-image:${image}`} : undefined),
    };
}

export const bannerModelFromAttrs = (getAttr: GetAttr): BannerModel =>
    bannerModel(fromDataAttrs(getAttr, bannerModelDefaults));
