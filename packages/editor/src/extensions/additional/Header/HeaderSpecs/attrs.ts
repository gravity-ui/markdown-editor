import {
    HEADER_FILLS,
    HeaderAttr,
    HeaderBackground,
    type HeaderBackgroundValue,
    HeaderDefaults,
    HeaderEffect,
    type HeaderEffectValue,
    type HeaderFillValue,
    HeaderFormat,
    type HeaderFormatValue,
    HeaderText,
    type HeaderTextValue,
} from './const';

export type HeaderAttrs = {
    [HeaderAttr.Format]: HeaderFormatValue;
    [HeaderAttr.Background]: HeaderBackgroundValue;
    [HeaderAttr.Fill]: HeaderFillValue;
    [HeaderAttr.Fill2]: HeaderFillValue;
    [HeaderAttr.Effect]: HeaderEffectValue;
    [HeaderAttr.Image]: string;
    [HeaderAttr.Text]: HeaderTextValue;
    [HeaderAttr.Seed]: number;
};

const MAX_SEED = 2 ** 31 - 1;

const oneOf =
    <T extends string>(values: readonly T[], fallback: T) =>
    (raw: unknown): T =>
        values.includes(raw as T) ? (raw as T) : fallback;

const toFormat = oneOf(Object.values(HeaderFormat), HeaderDefaults[HeaderAttr.Format]);
const toBackground = oneOf(Object.values(HeaderBackground), HeaderDefaults[HeaderAttr.Background]);
const toEffect = oneOf(Object.values(HeaderEffect), HeaderDefaults[HeaderAttr.Effect]);
const toText = oneOf(Object.values(HeaderText), HeaderDefaults[HeaderAttr.Text]);

const toFill = (raw: unknown, fallback: HeaderFillValue): HeaderFillValue =>
    HEADER_FILLS.includes(raw as HeaderFillValue) ? (raw as HeaderFillValue) : fallback;

const toSeed = (raw: unknown): number => {
    const value = Math.trunc(Number(raw));
    if (!Number.isFinite(value) || value < 0) return HeaderDefaults[HeaderAttr.Seed];
    return Math.min(value, MAX_SEED);
};

const toImage = (raw: unknown): string => (typeof raw === 'string' ? raw.trim() : '');

/** Единственная точка приведения значений: её зовут парсер директивы, parseDOM и команды. */
export function normalizeHeaderAttrs(raw: Readonly<Record<string, unknown>> = {}): HeaderAttrs {
    return {
        [HeaderAttr.Format]: toFormat(raw[HeaderAttr.Format]),
        [HeaderAttr.Background]: toBackground(raw[HeaderAttr.Background]),
        [HeaderAttr.Fill]: toFill(raw[HeaderAttr.Fill], HeaderDefaults[HeaderAttr.Fill]),
        [HeaderAttr.Fill2]: toFill(raw[HeaderAttr.Fill2], HeaderDefaults[HeaderAttr.Fill2]),
        [HeaderAttr.Effect]: toEffect(raw[HeaderAttr.Effect]),
        [HeaderAttr.Image]: toImage(raw[HeaderAttr.Image]),
        [HeaderAttr.Text]: toText(raw[HeaderAttr.Text]),
        [HeaderAttr.Seed]: toSeed(raw[HeaderAttr.Seed]),
    };
}

/** Второй цвет нужен градиенту и мешу, эффект — только изображению, зерно — только фигурам. */
export function isAttrUsed(attr: keyof HeaderAttrs, attrs: HeaderAttrs): boolean {
    const bg = attrs[HeaderAttr.Background];
    switch (attr) {
        case HeaderAttr.Fill2:
            return bg === HeaderBackground.Gradient || bg === HeaderBackground.Mesh;
        case HeaderAttr.Effect:
            return hasImage(attrs);
        case HeaderAttr.Seed:
            return hasShapes(attrs);
        default:
            return true;
    }
}

/** Свойство слоя фона: под изображением фигуры остаются в разметке, но не рисуются. */
export function hasShapes(attrs: HeaderAttrs): boolean {
    const bg = attrs[HeaderAttr.Background];
    return bg === HeaderBackground.Shapes || bg === HeaderBackground.Mesh;
}

export function hasImage(attrs: HeaderAttrs): boolean {
    return Boolean(attrs[HeaderAttr.Image]);
}

const SERIALIZED_ATTRS: readonly (keyof HeaderAttrs)[] = [
    HeaderAttr.Format,
    HeaderAttr.Background,
    HeaderAttr.Fill,
    HeaderAttr.Fill2,
    HeaderAttr.Effect,
    HeaderAttr.Image,
    HeaderAttr.Text,
    HeaderAttr.Seed,
];

const quote = (value: string): string => `"${value.replace(/[\\"]/g, '\\$&')}"`;

/** Цвет заливки пишется всегда: разметка не должна зависеть от дефолтов расширения. */
const isAlwaysWritten = (attr: keyof HeaderAttrs) => attr === HeaderAttr.Fill;

export function serializeHeaderAttrs(raw: Readonly<Record<string, unknown>>): string {
    const attrs = normalizeHeaderAttrs(raw);
    const pairs: string[] = [];

    for (const attr of SERIALIZED_ATTRS) {
        if (!isAttrUsed(attr, attrs)) continue;
        const value = String(attrs[attr]);
        if (!isAlwaysWritten(attr) && value === String(HeaderDefaults[attr])) continue;
        if (attr === HeaderAttr.Image && !value) continue;
        pairs.push(`${attr}=${quote(value)}`);
    }

    return pairs.length ? `{${pairs.join(' ')}}` : '';
}

const TITLE_ENTITIES: Record<string, string> = {
    '&': '&amp;',
    '\\': '&#92;',
    '[': '&#91;',
    ']': '&#93;',
    '\r': '&#13;',
    '\n': '&#10;',
};

/**
 * Парсер директивы читает метку через `unescapeAll`, поэтому спецсимволы едут сущностями.
 * Амперсанд первым: иначе экранирование само себя перепишет.
 */
export function escapeHeaderTitle(text: string): string {
    return text.replace(/[&\\[\]\r\n]/g, (char) => TITLE_ENTITIES[char]);
}
