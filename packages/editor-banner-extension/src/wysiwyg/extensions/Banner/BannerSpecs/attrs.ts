import {
    bannerBackgroundFromAttrs,
    bannerDimensionsFromAttrs,
} from '@gravity-ui/markdown-plugin-banner';

export const bannerNodeAttrs = (getAttr: (name: string) => string | null | undefined) => ({
    ...bannerDimensionsFromAttrs(getAttr),
    ...bannerBackgroundFromAttrs(getAttr),
});
