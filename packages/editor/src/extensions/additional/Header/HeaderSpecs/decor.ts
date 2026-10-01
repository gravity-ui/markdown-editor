import type {HeaderAttrs} from './attrs';
import {hasShapes} from './attrs';
import {
    HeaderAttr,
    HeaderBackground,
    HeaderFill,
    type HeaderFillValue,
    HeaderShapes,
} from './const';

export type HeaderShape = {
    size: number;
    x: number;
    y: number;
    opacity: number;
    fill?: HeaderFillValue;
    duration: number;
    delay: number;
};

const layouts = {
    [HeaderShapes.Diagonal]: [
        [0.53, 0.7, -0.43],
        [0.48, -0.07, 0.43],
    ],
    [HeaderShapes.Corner]: [[0.78, 0.62, -0.36]],
    [HeaderShapes.Edges]: [
        [0.5, -0.23, 0.06],
        [0.5, 0.78, 0.25],
    ],
    [HeaderShapes.Bottom]: [
        [0.5, 0.14, 0.7],
        [0.55, 0.68, 0.6],
    ],
    [HeaderShapes.Scatter]: [
        [0.4, 0.7, -0.24],
        [0.35, 0.04, 0.5],
        [0.3, 0.45, 0.35],
    ],
};

export function getHeaderShapes(attrs: HeaderAttrs): HeaderShape[] {
    if (!hasShapes(attrs)) return [];
    const mesh = attrs[HeaderAttr.Background] === HeaderBackground.Mesh;
    const geometry = layouts[attrs[HeaderAttr.Shapes] as keyof typeof layouts];
    const fill = (index: number): HeaderFillValue | undefined => {
        if (!mesh) return undefined;
        return index === 0 ? (attrs[HeaderAttr.Fill2] as HeaderFillValue) : HeaderFill.Blue;
    };
    return geometry.map(([size, x, y], index) => ({
        size,
        x,
        y,
        opacity: mesh ? 0.8 : 0.22,
        fill: fill(index),
        duration: 26 + index * 5,
        delay: -index * 9,
    }));
}
