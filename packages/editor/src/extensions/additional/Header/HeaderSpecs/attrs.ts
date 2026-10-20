import {
    HEADER_TITLE_SIZES,
    HeaderActionColor,
    type HeaderActionColorValue,
    HeaderActionType,
    type HeaderActionTypeValue,
    HeaderAttr,
    HeaderBackground,
    HeaderDefaults,
    HeaderDirection,
    HeaderEffect,
    HeaderFill,
    HeaderFit,
    type HeaderFitValue,
    HeaderFocus,
    type HeaderFocusValue,
    HeaderFormat,
    HeaderLayer,
    HeaderScale,
    HeaderShapes,
    HeaderSide,
    type HeaderSideValue,
    HeaderText,
} from './const';

export type HeaderAttrs = {-readonly [K in keyof typeof HeaderDefaults]: string};

type RawAttrs = Readonly<Record<string, unknown>>;

function choose<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
    return values.includes(value as T) ? (value as T) : fallback;
}

const choices = {
    [HeaderAttr.Format]: Object.values(HeaderFormat),
    [HeaderAttr.Align]: ['left', 'center', 'right'],
    [HeaderAttr.Vertical]: ['top', 'center', 'bottom'],
    [HeaderAttr.Fixed]: ['true', 'false'],
    [HeaderAttr.Background]: Object.values(HeaderBackground),
    [HeaderAttr.Fill]: Object.values(HeaderFill),
    [HeaderAttr.Fill2]: Object.values(HeaderFill),
    [HeaderAttr.Direction]: Object.values(HeaderDirection),
    [HeaderAttr.Shapes]: Object.values(HeaderShapes),
    [HeaderAttr.Scale]: Object.values(HeaderScale),
    [HeaderAttr.Effect]: Object.values(HeaderEffect),
    [HeaderAttr.Layer]: Object.values(HeaderLayer),
    [HeaderAttr.Fit]: Object.values(HeaderFit),
    [HeaderAttr.Focus]: Object.values(HeaderFocus),
    [HeaderAttr.Text]: Object.values(HeaderText),
};

const ATTR_ORDER = Object.values(HeaderAttr);

export function normalizeHeaderAttrs(raw: RawAttrs = {}): HeaderAttrs {
    const attrs = {...HeaderDefaults} as HeaderAttrs;
    for (const name of ATTR_ORDER) {
        const value = raw[name];
        if (name === HeaderAttr.Image) {
            attrs[name] = typeof value === 'string' ? value.trim() : '';
        } else {
            attrs[name] = choose(value, choices[name] as readonly string[], HeaderDefaults[name]);
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

export function serializeHeaderAttrs(raw: RawAttrs): string {
    const attrs = normalizeHeaderAttrs(raw);
    const pairs: string[] = [];
    for (const name of ATTR_ORDER) {
        if (!isAttrUsed(name, attrs)) continue;
        const value = attrs[name];
        if (!value || (name !== HeaderAttr.Fill && value === HeaderDefaults[name])) continue;
        pairs.push(`${name}=${quote(value)}`);
    }
    return pairs.length ? `{${pairs.join(' ')}}` : '';
}

export function normalizeHeaderTitleSize(raw: RawAttrs = {}): number {
    return Number(choose(raw.size, HEADER_TITLE_SIZES, '1'));
}

export type HeaderImageAttrs = {
    side: HeaderSideValue;
    fit: HeaderFitValue;
    focus: HeaderFocusValue;
};

export function normalizeHeaderImageAttrs(raw: RawAttrs = {}): HeaderImageAttrs {
    return {
        side: choose(raw.side, Object.values(HeaderSide), HeaderSide.Right),
        fit: choose(raw.fit, Object.values(HeaderFit), HeaderFit.Crop),
        focus: choose(raw.focus, Object.values(HeaderFocus), HeaderFocus.Center),
    };
}

export type HeaderActionAttrs = {
    type: HeaderActionTypeValue;
    color: HeaderActionColorValue;
};

export function normalizeHeaderActionAttrs(raw: RawAttrs = {}): HeaderActionAttrs {
    return {
        type: choose(raw.type, Object.values(HeaderActionType), HeaderActionType.Button),
        color: choose(raw.color, Object.values(HeaderActionColor), HeaderActionColor.Default),
    };
}
