import {cn} from '@bem-react/classname';

import {filesGalleryExcludeAttrs} from '../const';
import {toCssUrl} from '../url';
import {type GetAttr, dataAttrs, fromDataAttrs, nonDefaultValues} from '../utils';

import {
    type BannerLayout,
    type BannerModel,
    bannerClassName,
    bannerLayoutDefaults,
    bannerModelDefaults,
} from './const';
import {bannerModel, bannerModelValues} from './utils';

const b = cn(bannerClassName);

type BannerAttrsInput = Partial<Record<keyof BannerModel, unknown>>;

export function bannerAttrs(attrs: BannerAttrsInput): Record<string, string> {
    const model = bannerModel(attrs);
    const image = model['bg-image'] && toCssUrl(model['bg-image']);
    const theme = model['bg-image-theme'];
    return {
        class: b(
            {
                height: model.height,
                width: model.width,
                ...nonDefaultValues<BannerLayout>(model, bannerLayoutDefaults),
                'bg-color': model['bg-color'] ?? undefined,
                'bg-image': Boolean(image),
                'bg-image-blur': model['bg-image-blur'],
            },
            theme === 'system' ? undefined : ['g-root', `g-root_theme_${theme}`],
        ),
        ...filesGalleryExcludeAttrs,
        ...dataAttrs(bannerModelValues(model)),
        ...(image ? {style: `background-image:${image}`} : undefined),
    };
}

export const bannerModelFromAttrs = (getAttr: GetAttr): BannerModel =>
    bannerModel(fromDataAttrs(getAttr, bannerModelDefaults));
