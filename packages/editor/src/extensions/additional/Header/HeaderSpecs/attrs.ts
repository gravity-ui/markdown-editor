import {
    HEADER_FILLS,
    HEADER_FULL_TURN,
    HEADER_STEP_MAX,
    HEADER_STEP_MIN,
    HeaderAttr,
    HeaderBackground,
    type HeaderBackgroundValue,
    HeaderCrop,
    type HeaderCropValue,
    HeaderDefaults,
    HeaderEffect,
    type HeaderEffectValue,
    type HeaderFillValue,
    HeaderFit,
    type HeaderFitValue,
    HeaderFormat,
    type HeaderFormatValue,
    HeaderLayer,
    type HeaderLayerValue,
    HeaderText,
    type HeaderTextValue,
} from './const';

export type HeaderAttrs = {
    [HeaderAttr.Format]: HeaderFormatValue;
    [HeaderAttr.Background]: HeaderBackgroundValue;
    [HeaderAttr.Fill]: HeaderFillValue;
    [HeaderAttr.Fill2]: HeaderFillValue;
    [HeaderAttr.Angle]: number;
    [HeaderAttr.Effect]: HeaderEffectValue;
    [HeaderAttr.Image]: string;
    [HeaderAttr.Layer]: HeaderLayerValue;
    [HeaderAttr.Fit]: HeaderFitValue;
    [HeaderAttr.Crop]: HeaderCropValue;
    [HeaderAttr.Step]: number;
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
const toLayer = oneOf(Object.values(HeaderLayer), HeaderDefaults[HeaderAttr.Layer]);
const toFit = oneOf(Object.values(HeaderFit), HeaderDefaults[HeaderAttr.Fit]);
const toCrop = oneOf(Object.values(HeaderCrop), HeaderDefaults[HeaderAttr.Crop]);
const toEffect = oneOf(Object.values(HeaderEffect), HeaderDefaults[HeaderAttr.Effect]);
const toText = oneOf(Object.values(HeaderText), HeaderDefaults[HeaderAttr.Text]);

const toFill = (raw: unknown, fallback: HeaderFillValue): HeaderFillValue =>
    HEADER_FILLS.includes(raw as HeaderFillValue) ? (raw as HeaderFillValue) : fallback;

/** Число приходит строкой из директивы и из DOM, а отсутствующий атрибут — пустотой. */
const toInteger = (raw: unknown): number | null => {
    if (raw === null || raw === undefined || raw === '') return null;
    const value = Math.trunc(Number(raw));
    return Number.isFinite(value) ? value : null;
};

const toSeed = (raw: unknown): number => {
    const value = toInteger(raw);
    if (value === null || value < 0) return HeaderDefaults[HeaderAttr.Seed];
    return Math.min(value, MAX_SEED);
};

/** Угол берётся по модулю оборота: 523° — тот же наклон, что 163°. Отрицательный — в дефолт. */
const toAngle = (raw: unknown): number => {
    const value = toInteger(raw);
    if (value === null || value < 0) return HeaderDefaults[HeaderAttr.Angle];
    return value % HEADER_FULL_TURN;
};

/** Шаг плитки ограничен диапазоном: меньше нижней границы узор сливается, больше верхней — исчезает. */
const toStep = (raw: unknown): number => {
    const value = toInteger(raw);
    if (value === null) return HeaderDefaults[HeaderAttr.Step];
    return Math.min(Math.max(value, HEADER_STEP_MIN), HEADER_STEP_MAX);
};

const toImage = (raw: unknown): string => (typeof raw === 'string' ? raw.trim() : '');

/** Единственная точка приведения значений: её зовут парсер директивы, parseDOM и команды. */
export function normalizeHeaderAttrs(raw: Readonly<Record<string, unknown>> = {}): HeaderAttrs {
    return {
        [HeaderAttr.Format]: toFormat(raw[HeaderAttr.Format]),
        [HeaderAttr.Background]: toBackground(raw[HeaderAttr.Background]),
        [HeaderAttr.Fill]: toFill(raw[HeaderAttr.Fill], HeaderDefaults[HeaderAttr.Fill]),
        [HeaderAttr.Fill2]: toFill(raw[HeaderAttr.Fill2], HeaderDefaults[HeaderAttr.Fill2]),
        [HeaderAttr.Angle]: toAngle(raw[HeaderAttr.Angle]),
        [HeaderAttr.Effect]: toEffect(raw[HeaderAttr.Effect]),
        [HeaderAttr.Image]: toImage(raw[HeaderAttr.Image]),
        [HeaderAttr.Layer]: toLayer(raw[HeaderAttr.Layer]),
        [HeaderAttr.Fit]: toFit(raw[HeaderAttr.Fit]),
        [HeaderAttr.Crop]: toCrop(raw[HeaderAttr.Crop]),
        [HeaderAttr.Step]: toStep(raw[HeaderAttr.Step]),
        [HeaderAttr.Text]: toText(raw[HeaderAttr.Text]),
        [HeaderAttr.Seed]: toSeed(raw[HeaderAttr.Seed]),
    };
}

/**
 * Свойства основы остаются применимыми и под изображением: основа возвращается, когда файл убирают.
 * Свойства файла применимы только при заданной ссылке, дополнение — только к снимку на всю площадь.
 */
export function isAttrUsed(attr: keyof HeaderAttrs, attrs: HeaderAttrs): boolean {
    const bg = attrs[HeaderAttr.Background];
    switch (attr) {
        case HeaderAttr.Fill2:
            return bg === HeaderBackground.Gradient || bg === HeaderBackground.Mesh;
        case HeaderAttr.Angle:
            return bg === HeaderBackground.Gradient;
        case HeaderAttr.Step:
            return bg === HeaderBackground.Pattern || isTiled(attrs);
        case HeaderAttr.Layer:
            return hasImage(attrs);
        case HeaderAttr.Fit:
        case HeaderAttr.Crop:
            return hasImage(attrs) && !isTiled(attrs);
        case HeaderAttr.Effect:
            return isCovered(attrs);
        case HeaderAttr.Seed:
            return hasShapes(attrs);
        default:
            return true;
    }
}

/** Свойство слоя фона: под изображением на всю площадь фигуры остаются в разметке, но не рисуются. */
export function hasShapes(attrs: HeaderAttrs): boolean {
    const bg = attrs[HeaderAttr.Background];
    return bg === HeaderBackground.Shapes || bg === HeaderBackground.Mesh;
}

export function hasImage(attrs: HeaderAttrs): boolean {
    return Boolean(attrs[HeaderAttr.Image]);
}

/** Файл повторяется плиткой поверх основы: масштаб и кадр к нему не относятся, шаг относится. */
export function isTiled(attrs: HeaderAttrs): boolean {
    return hasImage(attrs) && attrs[HeaderAttr.Layer] === HeaderLayer.Tile;
}

/** Файл занимает всю площадь: основа под ним не видна, дополнение поверх него применяется. */
export function isCovered(attrs: HeaderAttrs): boolean {
    return hasImage(attrs) && attrs[HeaderAttr.Layer] === HeaderLayer.Cover;
}

const SERIALIZED_ATTRS: readonly (keyof HeaderAttrs)[] = [
    HeaderAttr.Format,
    HeaderAttr.Background,
    HeaderAttr.Fill,
    HeaderAttr.Fill2,
    HeaderAttr.Angle,
    HeaderAttr.Effect,
    HeaderAttr.Image,
    HeaderAttr.Layer,
    HeaderAttr.Fit,
    HeaderAttr.Crop,
    HeaderAttr.Step,
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
