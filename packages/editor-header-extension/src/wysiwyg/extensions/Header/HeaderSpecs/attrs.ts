import {
    headerBackgroundFromAttrs,
    headerDimensionsFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

export const headerNodeAttrs = (getAttr: (name: string) => string | null | undefined) => ({
    ...headerDimensionsFromAttrs(getAttr),
    ...headerBackgroundFromAttrs(getAttr),
});
