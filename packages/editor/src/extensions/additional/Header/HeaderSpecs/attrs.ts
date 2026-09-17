import {
    HEADER_FILL_SWATCHES,
    HeaderActionAttr,
    type HeaderActionColorValue,
    HeaderActionDefaults,
    HeaderActionType,
    type HeaderActionTypeValue,
    HeaderAttr,
    HeaderBackground,
    type HeaderBackgroundValue,
    HeaderBorder,
    type HeaderBorderValue,
    HeaderDecor,
    type HeaderDecorValue,
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
    [HeaderAttr.Decor]: HeaderDecorValue;
    [HeaderAttr.Text]: HeaderTextColorValue;
    [HeaderAttr.Image]: string;
    [HeaderAttr.Border]: HeaderBorderValue;
};

export type HeaderActionAttrs = {
    [HeaderActionAttr.Type]: HeaderActionTypeValue;
    [HeaderActionAttr.Href]: string;
    [HeaderActionAttr.Color]: HeaderActionColorValue;
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
const asDecor = oneOf<HeaderDecorValue>(Object.values(HeaderDecor), HeaderDefaults.decor);
const asText = oneOf<HeaderTextColorValue>(Object.values(HeaderTextColor), HeaderDefaults.text);
const asFill = oneOf<HeaderFillValue>(fillValues, HeaderDefaults.fill);
const asActionType = oneOf<HeaderActionTypeValue>(
    Object.values(HeaderActionType),
    HeaderActionDefaults.type,
);
const asActionColor = oneOf<HeaderActionColorValue>(
    ['brand', ...fillValues],
    HeaderActionDefaults.color,
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
        [HeaderAttr.Decor]: asDecor(raw[HeaderAttr.Decor]),
        [HeaderAttr.Text]: asText(raw[HeaderAttr.Text]),
        [HeaderAttr.Image]: asString(raw[HeaderAttr.Image]),
        [HeaderAttr.Border]: asBorder(raw[HeaderAttr.Border]),
    };
}

export function normalizeHeaderActionAttrs(raw: Record<string, unknown> = {}): HeaderActionAttrs {
    return {
        [HeaderActionAttr.Type]: asActionType(raw[HeaderActionAttr.Type]),
        [HeaderActionAttr.Href]: asString(raw[HeaderActionAttr.Href]),
        [HeaderActionAttr.Color]: asActionColor(raw[HeaderActionAttr.Color]),
    };
}

/** Stable attribute order for serialization. */
const SERIALIZED_ATTR_ORDER = [
    HeaderAttr.Format,
    HeaderAttr.Edges,
    HeaderAttr.Background,
    HeaderAttr.Layout,
    HeaderAttr.Fill,
    HeaderAttr.Decor,
    HeaderAttr.Text,
    HeaderAttr.Image,
    HeaderAttr.Border,
] as const;

/** Axes that only make sense on their own background; on the other one they are markup noise. */
const BACKGROUND_BOUND: Partial<Record<keyof HeaderAttrs, HeaderBackgroundValue>> = {
    [HeaderAttr.Layout]: HeaderBackground.Image,
    [HeaderAttr.Decor]: HeaderBackground.Fill,
};

function quote(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function serializeDirectiveValue(value: string): string {
    return /^[\w-]+$/.test(value) ? value : quote(value);
}

export function serializeHeaderAttrs(attrs: Partial<HeaderAttrs>): string {
    const normalized = normalizeHeaderAttrs(attrs as Record<string, unknown>);
    const pairs: string[] = [];

    for (const key of SERIALIZED_ATTR_ORDER) {
        const value = normalized[key];
        if (value === HeaderDefaults[key]) continue;

        const boundTo = BACKGROUND_BOUND[key];
        if (boundTo && normalized.bg !== boundTo) continue;

        pairs.push(`${key}=${serializeDirectiveValue(value)}`);
    }

    return pairs.length ? ` {${pairs.join(' ')}}` : '';
}
