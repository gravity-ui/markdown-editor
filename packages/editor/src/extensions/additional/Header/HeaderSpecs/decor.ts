import type {HeaderAttrs} from './attrs';
import {hasShapes} from './attrs';
import {HeaderAttr, HeaderDecor, HeaderShape} from './const';

/** Цвет пятна `mesh`: переменная заливки, а не имя цвета, поэтому системная заливка тоже работает. */
export type HeaderShapeTone = 'fill' | 'fill2';

export type HeaderShapeItem = {
    size: number;
    x: number;
    y: number;
    opacity: number;
    tone?: HeaderShapeTone;
    duration: number;
    delay: number;
};

const layouts = {
    [HeaderShape.Diagonal]: [
        [0.53, 0.7, -0.43],
        [0.48, -0.07, 0.43],
    ],
    [HeaderShape.Corner]: [[0.78, 0.62, -0.36]],
    [HeaderShape.Edges]: [
        [0.5, -0.23, 0.06],
        [0.5, 0.78, 0.25],
    ],
    [HeaderShape.Bottom]: [
        [0.5, 0.14, 0.7],
        [0.55, 0.68, 0.6],
    ],
    [HeaderShape.Scatter]: [
        [0.4, 0.7, -0.24],
        [0.35, 0.04, 0.5],
        [0.3, 0.45, 0.35],
    ],
};

export function getHeaderShapes(attrs: HeaderAttrs): HeaderShapeItem[] {
    if (!hasShapes(attrs)) return [];
    const mesh = attrs[HeaderAttr.Decor] === HeaderDecor.Mesh;
    const geometry = layouts[attrs[HeaderAttr.Shape] as keyof typeof layouts];
    return geometry.map(([size, x, y], index) => ({
        size,
        x,
        y,
        opacity: mesh ? 0.8 : 0.22,
        tone: mesh ? (['fill2', 'fill'] as const)[index % 2] : undefined,
        duration: 26 + index * 5,
        delay: -index * 9,
    }));
}
