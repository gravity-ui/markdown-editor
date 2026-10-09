import {
    HEADER_FILLS,
    HeaderAttr,
    HeaderBackground,
    HeaderDefaults,
    HeaderDirection,
    HeaderEffect,
    HeaderFit,
    HeaderFocus,
    HeaderFormat,
    HeaderLayer,
    HeaderScale,
    HeaderShapes,
    HeaderText,
} from './const';

export type HeaderAttrs = {-readonly [K in keyof typeof HeaderDefaults]: string};

const choices = {
    [HeaderAttr.Format]: Object.values(HeaderFormat),
    [HeaderAttr.Background]: Object.values(HeaderBackground),
    [HeaderAttr.Fill]: HEADER_FILLS,
    [HeaderAttr.Fill2]: HEADER_FILLS,
    [HeaderAttr.Direction]: Object.values(HeaderDirection),
    [HeaderAttr.Shapes]: Object.values(HeaderShapes),
    [HeaderAttr.Scale]: Object.values(HeaderScale),
    [HeaderAttr.Effect]: Object.values(HeaderEffect),
    [HeaderAttr.Layer]: Object.values(HeaderLayer),
    [HeaderAttr.Fit]: Object.values(HeaderFit),
    [HeaderAttr.Focus]: Object.values(HeaderFocus),
    [HeaderAttr.Text]: Object.values(HeaderText),
};

const ATTR_ORDER = [
    HeaderAttr.Format,
    HeaderAttr.Background,
    HeaderAttr.Fill,
    HeaderAttr.Fill2,
    HeaderAttr.Direction,
    HeaderAttr.Shapes,
    HeaderAttr.Scale,
    HeaderAttr.Image,
    HeaderAttr.Layer,
    HeaderAttr.Fit,
    HeaderAttr.Focus,
    HeaderAttr.Effect,
    HeaderAttr.Text,
] as const;

export function normalizeHeaderAttrs(raw: Readonly<Record<string, unknown>> = {}): HeaderAttrs {
    const attrs = {...HeaderDefaults} as HeaderAttrs;
    for (const name of ATTR_ORDER) {
        if (name === HeaderAttr.Image) {
            attrs[name] = typeof raw[name] === 'string' ? raw[name].trim() : '';
        } else {
            const value = raw[name];
            if ((choices[name] as readonly unknown[]).includes(value)) attrs[name] = String(value);
        }
    }
    return attrs;
}

export function hasImage(attrs: HeaderAttrs): boolean {
    return Boolean(attrs[HeaderAttr.Image]);
}

export function isTiled(attrs: HeaderAttrs): boolean {
    return hasImage(attrs) && attrs[HeaderAttr.Layer] === HeaderLayer.Tile;
}

export function isCovered(attrs: HeaderAttrs): boolean {
    return hasImage(attrs) && attrs[HeaderAttr.Layer] === HeaderLayer.Full;
}

export function hasShapes(attrs: HeaderAttrs): boolean {
    return [HeaderBackground.Shapes, HeaderBackground.Mesh].includes(
        attrs[HeaderAttr.Background] as never,
    );
}

export function isAttrUsed(attr: keyof HeaderAttrs, attrs: HeaderAttrs): boolean {
    switch (attr) {
        case HeaderAttr.Fill2:
            return [HeaderBackground.Gradient, HeaderBackground.Mesh].includes(attrs.bg as never);
        case HeaderAttr.Direction:
            return attrs.bg === HeaderBackground.Gradient;
        case HeaderAttr.Shapes:
            return hasShapes(attrs);
        case HeaderAttr.Scale:
            return attrs.bg === HeaderBackground.Pattern || isTiled(attrs);
        case HeaderAttr.Layer:
            return hasImage(attrs);
        case HeaderAttr.Fit:
        case HeaderAttr.Focus:
            return hasImage(attrs) && !isTiled(attrs);
        case HeaderAttr.Effect:
            return isCovered(attrs);
        default:
            return true;
    }
}

const quote = (value: string): string => `"${value.replace(/[\\"]/g, '\\$&')}"`;

export function serializeHeaderAttrs(raw: Readonly<Record<string, unknown>>): string {
    const attrs = normalizeHeaderAttrs(raw);
    const pairs: string[] = [];
    for (const name of ATTR_ORDER) {
        if (!isAttrUsed(name, attrs)) continue;
        const value = String(attrs[name]);
        if (!value || (name !== HeaderAttr.Fill && value === HeaderDefaults[name])) continue;
        pairs.push(`${name}=${quote(value)}`);
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

export function escapeHeaderTitle(value: string): string {
    return value.replace(/[&\\[\]\r\n]/g, (char) => TITLE_ENTITIES[char]);
}
