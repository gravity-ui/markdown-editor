import {
    bannerBackgroundFromAttrs,
    bannerDimensionsFromAttrs,
    bannerLayoutFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

export const bannerNodeAttrs = (getAttr: (name: string) => string | null | undefined) => ({
    ...bannerDimensionsFromAttrs(getAttr),
    ...bannerLayoutFromAttrs(getAttr),
    ...bannerBackgroundFromAttrs(getAttr),
});
