import type {HeaderAttrs} from './attrs';

export type HeaderShape = {
    size: number;
    x: number;
    y: number;
    opacity: number;
    duration: number;
    delay: number;
};
const layouts: Record<string, number[][]> = {
    diagonal: [
        [0.53, 0.7, -0.43],
        [0.48, -0.07, 0.43],
    ],
    corner: [[0.78, 0.62, -0.36]],
    edges: [
        [0.5, -0.23, 0.06],
        [0.5, 0.78, 0.25],
    ],
    bottom: [
        [0.5, 0.14, 0.7],
        [0.55, 0.68, 0.6],
    ],
    scatter: [
        [0.4, 0.7, -0.24],
        [0.35, 0.04, 0.5],
        [0.3, 0.45, 0.35],
    ],
};
export function getHeaderShapes(attrs: HeaderAttrs): HeaderShape[] {
    return (layouts[attrs.shapes] ?? []).map(([size, x, y], index) => ({
        size,
        x,
        y,
        opacity: 0.22,
        duration: 26 + index * 5,
        delay: -index * 9,
    }));
}
