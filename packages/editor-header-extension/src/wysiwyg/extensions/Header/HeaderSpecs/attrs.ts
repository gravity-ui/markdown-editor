import {
    headerBackgroundFromAttrs,
    headerDimensionsFromAttrs,
    headerLayoutFromAttrs,
} from '@gravity-ui/markdown-plugin-header';

export const headerNodeAttrs = (getAttr: (name: string) => string | null | undefined) => ({
    ...headerDimensionsFromAttrs(getAttr),
    ...headerLayoutFromAttrs(getAttr),
    ...headerBackgroundFromAttrs(getAttr),
});
