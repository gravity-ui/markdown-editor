import {
    HEADER_FILLS,
    HeaderAttr,
    HeaderBackground,
    type HeaderBackgroundValue,
    HeaderDecor,
    type HeaderDecorValue,
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
    [HeaderAttr.Decor]: HeaderDecorValue;
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
const toDecor = oneOf(Object.values(HeaderDecor), HeaderDefaults[HeaderAttr.Decor]);
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
        [HeaderAttr.Decor]: toDecor(raw[HeaderAttr.Decor]),
        [HeaderAttr.Effect]: toEffect(raw[HeaderAttr.Effect]),
        [HeaderAttr.Image]: toImage(raw[HeaderAttr.Image]),
        [HeaderAttr.Text]: toText(raw[HeaderAttr.Text]),
        [HeaderAttr.Seed]: toSeed(raw[HeaderAttr.Seed]),
    };
}

/** Второй цвет нужен градиенту и мешу, декор — только поверх заливки, эффект и картинка — только у изображения. */
export function isAttrUsed(attr: keyof HeaderAttrs, attrs: HeaderAttrs): boolean {
    const bg = attrs[HeaderAttr.Background];
    switch (attr) {
        case HeaderAttr.Fill2:
            return bg === HeaderBackground.Gradient || bg === HeaderBackground.Mesh;
        case HeaderAttr.Decor:
            return bg === HeaderBackground.Fill;
        case HeaderAttr.Effect:
        case HeaderAttr.Image:
            return bg === HeaderBackground.Image;
        case HeaderAttr.Seed:
            return hasShapes(attrs);
        default:
            return true;
    }
}

export function hasShapes(attrs: HeaderAttrs): boolean {
    const bg = attrs[HeaderAttr.Background];
    if (bg === HeaderBackground.Mesh) return true;
    return bg === HeaderBackground.Fill && attrs[HeaderAttr.Decor] === HeaderDecor.Shapes;
}

const SERIALIZED_ATTRS: readonly (keyof HeaderAttrs)[] = [
    HeaderAttr.Format,
    HeaderAttr.Background,
    HeaderAttr.Fill,
    HeaderAttr.Fill2,
    HeaderAttr.Decor,
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
