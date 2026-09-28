import type {HeaderAttrs} from './attrs';
import {hasShapes} from './attrs';
import {
    HEADER_FILLS,
    HeaderAttr,
    HeaderBackground,
    HeaderFill,
    type HeaderFillValue,
} from './const';

export type HeaderShape = {
    /** Доля ширины блока. */
    size: number;
    /** Левый край, доля ширины блока. */
    x: number;
    /** Верхний край, доля высоты блока. */
    y: number;
    opacity: number;
    /** Пусто — белая фигура поверх заливки. */
    fill?: HeaderFillValue;
    /** Секунды. */
    duration: number;
    /** Секунды, отрицательный — анимация начинается с середины. */
    delay: number;
};

/** Раскладка из макета: две светлые фигуры поверх заливки и три цветные у меша. */
const CURATED_DECOR: readonly HeaderShape[] = [
    {size: 0.53, x: 0.7, y: -0.43, opacity: 0.2, duration: 26, delay: 0},
    {size: 0.48, x: -0.07, y: 0.43, opacity: 0.22, duration: 32, delay: -9},
];

const CURATED_MESH: readonly HeaderShape[] = [
    {size: 0.57, x: 0.33, y: 0.43, opacity: 0.8, fill: HeaderFill.Teal, duration: 28, delay: 0},
    {size: 0.48, x: 0.66, y: -0.21, opacity: 0.85, fill: HeaderFill.Red, duration: 34, delay: -11},
    {size: 0.53, x: -0.11, y: -0.29, opacity: 0.9, fill: HeaderFill.Blue, duration: 30, delay: -21},
];

export function mulberry32(seed: number): () => number {
    let a = seed | 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const between = (random: () => number, min: number, max: number) => min + random() * (max - min);
const round = (value: number, digits = 3) => Number(value.toFixed(digits));

/** Геометрия фигур — чистая функция атрибутов: одна и та же разметка везде рисуется одинаково. */
export function getHeaderShapes(attrs: HeaderAttrs): HeaderShape[] {
    if (!hasShapes(attrs)) return [];

    const mesh = attrs[HeaderAttr.Background] === HeaderBackground.Mesh;
    const seed = attrs[HeaderAttr.Seed];
    if (!seed) return [...(mesh ? CURATED_MESH : CURATED_DECOR)];

    const random = mulberry32(seed);
    const palette = HEADER_FILLS.filter((fill) => fill !== attrs[HeaderAttr.Fill]);
    const count = mesh ? 3 : 2 + Math.floor(random() * 2);

    return Array.from({length: count}, (_, index) => ({
        size: round(between(random, 0.42, 0.62)),
        x: round(between(random, -0.18, 0.86)),
        y: round(between(random, -0.55, 0.5)),
        opacity: round(mesh ? between(random, 0.78, 0.92) : between(random, 0.16, 0.26)),
        fill: mesh
            ? index === 0
                ? attrs[HeaderAttr.Fill2]
                : palette[Math.floor(random() * palette.length)]
            : undefined,
        duration: Math.round(between(random, 22, 38)),
        delay: -Math.round(between(random, 0, 24)),
    }));
}
