import {
    HEADER_FILL_SWATCHES,
    HeaderActionAttr,
    HeaderActionDefaults,
    HeaderActionType,
    type HeaderActionTypeValue,
    HeaderAttr,
    HeaderBackground,
    type HeaderBackgroundValue,
    HeaderBorder,
    type HeaderBorderValue,
    HeaderDefaults,
    HeaderEdges,
    type HeaderEdgesValue,
    type HeaderFillValue,
    HeaderFormat,
    type HeaderFormatValue,
    HeaderLayout,
    type HeaderLayoutValue,
    HeaderTextColor,
    type HeaderTextColorValue,
} from './const';

export type HeaderAttrs = {
    [HeaderAttr.Format]: HeaderFormatValue;
    [HeaderAttr.Edges]: HeaderEdgesValue;
    [HeaderAttr.Layout]: HeaderLayoutValue;
    [HeaderAttr.Background]: HeaderBackgroundValue;
    [HeaderAttr.Fill]: HeaderFillValue;
    [HeaderAttr.Text]: HeaderTextColorValue;
    [HeaderAttr.Image]: string;
    [HeaderAttr.Border]: HeaderBorderValue;
};

export type HeaderActionAttrs = {
    [HeaderActionAttr.Type]: HeaderActionTypeValue;
    [HeaderActionAttr.Href]: string;
};

const fillValues = HEADER_FILL_SWATCHES.map(({value}) => value) as readonly string[];

function oneOf<T extends string>(values: readonly string[], fallback: T) {
    return (raw: unknown): T =>
        typeof raw === 'string' && values.includes(raw) ? (raw as T) : fallback;
}

const asFormat = oneOf<HeaderFormatValue>(Object.values(HeaderFormat), HeaderDefaults.format);
const asEdges = oneOf<HeaderEdgesValue>(Object.values(HeaderEdges), HeaderDefaults.edges);
const asLayout = oneOf<HeaderLayoutValue>(Object.values(HeaderLayout), HeaderDefaults.layout);
const asBackground = oneOf<HeaderBackgroundValue>(
    Object.values(HeaderBackground),
    HeaderDefaults.bg,
);
const asBorder = oneOf<HeaderBorderValue>(Object.values(HeaderBorder), HeaderDefaults.border);
const asText = oneOf<HeaderTextColorValue>(Object.values(HeaderTextColor), HeaderDefaults.text);
const asFill = oneOf<HeaderFillValue>(fillValues, HeaderDefaults.fill);
const asActionType = oneOf<HeaderActionTypeValue>(
    Object.values(HeaderActionType),
    HeaderActionDefaults.type,
);

function asString(raw: unknown): string {
    return typeof raw === 'string' ? raw : '';
}

/** Normalize attributes from Markdown and pasted HTML. */
export function normalizeHeaderAttrs(raw: Record<string, unknown> = {}): HeaderAttrs {
    return {
        [HeaderAttr.Format]: asFormat(raw[HeaderAttr.Format]),
        [HeaderAttr.Edges]: asEdges(raw[HeaderAttr.Edges]),
        [HeaderAttr.Layout]: asLayout(raw[HeaderAttr.Layout]),
        [HeaderAttr.Background]: asBackground(raw[HeaderAttr.Background]),
        [HeaderAttr.Fill]: asFill(raw[HeaderAttr.Fill]),
        [HeaderAttr.Text]: asText(raw[HeaderAttr.Text]),
        [HeaderAttr.Image]: asString(raw[HeaderAttr.Image]),
        [HeaderAttr.Border]: asBorder(raw[HeaderAttr.Border]),
    };
}

export function normalizeHeaderActionAttrs(raw: Record<string, unknown> = {}): HeaderActionAttrs {
    return {
        [HeaderActionAttr.Type]: asActionType(raw[HeaderActionAttr.Type]),
        [HeaderActionAttr.Href]: asString(raw[HeaderActionAttr.Href]),
    };
}

/** Stable attribute order for serialization. */
const SERIALIZED_ATTR_ORDER = [
    HeaderAttr.Format,
    HeaderAttr.Edges,
    HeaderAttr.Background,
    HeaderAttr.Layout,
    HeaderAttr.Fill,
    HeaderAttr.Text,
    HeaderAttr.Image,
    HeaderAttr.Border,
] as const;

function quote(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function serializeValue(value: string): string {
    return /^[\w-]+$/.test(value) ? value : quote(value);
}

export function serializeHeaderAttrs(attrs: Partial<HeaderAttrs>): string {
    const normalized = normalizeHeaderAttrs(attrs as Record<string, unknown>);
    const pairs: string[] = [];

    for (const key of SERIALIZED_ATTR_ORDER) {
        const value = normalized[key];
        if (value === HeaderDefaults[key]) continue;
        // Layout applies only to image backgrounds.
        if (key === HeaderAttr.Layout && normalized.bg !== HeaderBackground.Image) continue;
        pairs.push(`${key}=${serializeValue(value)}`);
    }

    return pairs.length ? ` {${pairs.join(' ')}}` : '';
}
