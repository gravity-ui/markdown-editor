import {Colors} from '../../../yfm/Color/const';
import {serializeAttrs} from '../../Button/ButtonSpecs/attrs';

import {
    HEADER_FILLS,
    HeaderDefaults,
    HeaderEffect,
    type HeaderImageDefaults,
    HeaderImageTheme,
    HeaderShapes,
    HeaderTitleDefaults,
} from './const';

export type HeaderAttrs = {-readonly [K in keyof typeof HeaderDefaults]: string};
const choices: Partial<Record<keyof HeaderAttrs, readonly string[]>> = {
    height: ['s', 'm', 'l'],
    width: ['s', 'm', 'l', 'full'],
    align: ['left', 'center', 'right'],
    vertical: ['top', 'center', 'bottom'],
    title: ['true', 'false'],
    description: ['true', 'false'],
    fill: ['none', ...HEADER_FILLS],
    shapes: Object.values(HeaderShapes),
    effect: Object.values(HeaderEffect),
    'image-enabled': ['true', 'false'],
    text: ['auto', ...Object.values(Colors)],
    'bg-image-theme': Object.values(HeaderImageTheme),
};
export function normalizeHeaderAttrs(raw: Readonly<Record<string, unknown>> = {}): HeaderAttrs {
    const attrs = {...HeaderDefaults} as HeaderAttrs;
    for (const key of Object.keys(HeaderDefaults) as (keyof HeaderAttrs)[]) {
        const value = raw[key];
        if (choices[key]) {
            if (choices[key]?.includes(String(value))) attrs[key] = String(value);
        } else if (typeof value === 'string') attrs[key] = value.trim();
    }
    return attrs;
}
export function normalizeHeaderImageAttrs(
    raw: Readonly<Record<string, unknown>> = {},
): typeof HeaderImageDefaults {
    return {
        src: typeof raw.src === 'string' ? raw.src.trim() : '',
        alt: typeof raw.alt === 'string' ? raw.alt : '',
        name: typeof raw.name === 'string' ? raw.name : '',
        enabled: raw.enabled === false || raw.enabled === 'false' ? 'false' : 'true',
    };
}
export const hasShapes = (attrs: HeaderAttrs) => attrs.shapes !== 'none';
export function normalizeHeaderTitleAttrs(raw: Readonly<Record<string, unknown>> = {}) {
    const size = String(raw.size);
    const color = String(raw.color);
    return {
        size: /^[1-6]$/.test(size) ? size : HeaderTitleDefaults.size,
        color: Object.values(Colors).includes(color as Colors) ? color : HeaderTitleDefaults.color,
    };
}
export const serializeHeaderAttrs = (raw: Readonly<Record<string, unknown>>) =>
    serializeAttrs(normalizeHeaderAttrs(raw), HeaderDefaults);
