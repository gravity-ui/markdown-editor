import {HEADER_DEFAULT_HEIGHT, HeaderAttr, HeaderHeight, headerClassName} from './const';

const heights = new Set<unknown>(Object.values(HeaderHeight));

const isHeaderHeight = (value: unknown): value is HeaderHeight => heights.has(value);

export const normalizeHeaderHeight = (value: unknown): HeaderHeight =>
    isHeaderHeight(value) ? value : HEADER_DEFAULT_HEIGHT;

export const headerHeightDataAttr = `data-${HeaderAttr.Height}`;

/** Атрибуты DOM блока, общие для превью и ВИЗИВИГ. */
export const headerDomAttrs = (height: HeaderHeight) => ({
    class: `${headerClassName} ${headerClassName}_${HeaderAttr.Height}_${height}`,
    [headerHeightDataAttr]: height,
});
