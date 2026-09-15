import {
    HEADER_FILL_SWATCHES,
    HeaderActionAttr,
    HeaderActionDefaults,
    HeaderActionVariant,
    type HeaderActionVariantValue,
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
    [HeaderAttr.Blobs]: boolean;
    [HeaderAttr.Seed]: number;
};

export type HeaderActionAttrs = {
    [HeaderActionAttr.Href]: string;
    [HeaderActionAttr.Variant]: HeaderActionVariantValue;
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
const asVariant = oneOf<HeaderActionVariantValue>(
    Object.values(HeaderActionVariant),
    HeaderActionDefaults.variant,
);

function asBoolean(raw: unknown, fallback: boolean): boolean {
    if (typeof raw === 'boolean') return raw;
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return fallback;
}

function asString(raw: unknown): string {
    return typeof raw === 'string' ? raw : '';
}

function asSeed(raw: unknown): number {
    const seed = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
    return Number.isFinite(seed) && seed >= 0 ? Math.trunc(seed) : HeaderDefaults.seed;
}

/**
 * Единственная точка приведения значений: её зовут и парсер директивы, и `parseDOM`, и команды
 * тулбара. Неизвестное значение схлопывается в дефолт, а не доезжает до CSS.
 */
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
        [HeaderAttr.Blobs]: asBoolean(raw[HeaderAttr.Blobs], HeaderDefaults.blobs),
        [HeaderAttr.Seed]: asSeed(raw[HeaderAttr.Seed]),
    };
}

export function normalizeHeaderActionAttrs(raw: Record<string, unknown> = {}): HeaderActionAttrs {
    return {
        [HeaderActionAttr.Href]: asString(raw[HeaderActionAttr.Href]),
        [HeaderActionAttr.Variant]: asVariant(raw[HeaderActionAttr.Variant]),
    };
}

/** Порядок ключей фиксирован, дефолты опускаются — иначе round-trip падает от перестановок. */
const SERIALIZED_ATTR_ORDER = [
    HeaderAttr.Format,
    HeaderAttr.Edges,
    HeaderAttr.Background,
    HeaderAttr.Layout,
    HeaderAttr.Fill,
    HeaderAttr.Text,
    HeaderAttr.Image,
    HeaderAttr.Border,
    HeaderAttr.Blobs,
    HeaderAttr.Seed,
] as const;

function quote(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function serializeValue(value: HeaderAttrs[keyof HeaderAttrs]): string {
    if (typeof value === 'boolean' || typeof value === 'number') return String(value);
    return /^[\w-]+$/.test(value) ? value : quote(value);
}

export function serializeHeaderAttrs(attrs: Partial<HeaderAttrs>): string {
    const normalized = normalizeHeaderAttrs(attrs as Record<string, unknown>);
    const pairs: string[] = [];

    for (const key of SERIALIZED_ATTR_ORDER) {
        const value = normalized[key];
        if (value === HeaderDefaults[key]) continue;
        // layout осмысленен только поверх картинки — иначе он мусор в разметке
        if (key === HeaderAttr.Layout && normalized.bg !== HeaderBackground.Image) continue;
        pairs.push(`${key}=${serializeValue(value)}`);
    }

    return pairs.length ? ` {${pairs.join(' ')}}` : '';
}

export function serializeHeaderActionAttrs(attrs: Partial<HeaderActionAttrs>): string {
    const {href, variant} = normalizeHeaderActionAttrs(attrs as Record<string, unknown>);
    const pairs: string[] = [];
    if (href) pairs.push(`${HeaderActionAttr.Href}=${quote(href)}`);
    if (variant !== HeaderActionDefaults.variant) {
        pairs.push(`${HeaderActionAttr.Variant}=${variant}`);
    }
    return pairs.length ? `{${pairs.join(' ')}}` : '';
}
