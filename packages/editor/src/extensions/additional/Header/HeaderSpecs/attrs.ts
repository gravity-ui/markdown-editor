import {
    HEADER_TITLE_SIZES,
    HeaderActionColor,
    type HeaderActionColorValue,
    HeaderActionType,
    type HeaderActionTypeValue,
    HeaderAlign,
    HeaderAttr,
    HeaderBackground,
    HeaderBorder,
    HeaderDecor,
    HeaderDefaults,
    HeaderDirection,
    HeaderEdges,
    HeaderFill,
    HeaderFit,
    type HeaderFitValue,
    HeaderFocus,
    type HeaderFocusValue,
    HeaderFormat,
    HeaderLayout,
    HeaderPalette,
    HeaderScale,
    HeaderShape,
    HeaderSide,
    type HeaderSideValue,
    HeaderText,
    HeaderVertical,
} from './const';

export type HeaderAttrs = {-readonly [K in keyof typeof HeaderDefaults]: string};

type RawAttrs = Readonly<Record<string, unknown>>;

function choose<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
    return values.includes(value as T) ? (value as T) : fallback;
}

const choices: Record<Exclude<keyof HeaderAttrs, 'image'>, readonly string[]> = {
    [HeaderAttr.Format]: Object.values(HeaderFormat),
    [HeaderAttr.Edges]: Object.values(HeaderEdges),
    [HeaderAttr.Fixed]: ['true', 'false'],
    [HeaderAttr.Align]: Object.values(HeaderAlign),
    [HeaderAttr.Vertical]: Object.values(HeaderVertical),
    [HeaderAttr.Border]: Object.values(HeaderBorder),
    [HeaderAttr.Background]: Object.values(HeaderBackground),
    [HeaderAttr.Layout]: Object.values(HeaderLayout),
    [HeaderAttr.Fit]: Object.values(HeaderFit),
    [HeaderAttr.Focus]: Object.values(HeaderFocus),
    [HeaderAttr.Fill]: Object.values(HeaderFill),
    [HeaderAttr.Fill2]: Object.values(HeaderPalette),
    [HeaderAttr.Decor]: Object.values(HeaderDecor),
    [HeaderAttr.Direction]: Object.values(HeaderDirection),
    [HeaderAttr.Shape]: Object.values(HeaderShape),
    [HeaderAttr.Scale]: Object.values(HeaderScale),
    [HeaderAttr.Text]: Object.values(HeaderText),
};

const ATTR_ORDER = Object.values(HeaderAttr);

/** `bg="image"` без адреса в `image` заменяется заливкой: показывать нечего. */
export function normalizeHeaderAttrs(raw: RawAttrs = {}): HeaderAttrs {
    const attrs = {...HeaderDefaults} as HeaderAttrs;
    for (const name of ATTR_ORDER) {
        const value = raw[name];
        if (name === HeaderAttr.Image) {
            attrs[name] = typeof value === 'string' ? value.trim() : '';
        } else {
            attrs[name] = choose(value, choices[name], HeaderDefaults[name]);
        }
    }
    if (!attrs[HeaderAttr.Image]) attrs[HeaderAttr.Background] = HeaderBackground.Fill;
    return attrs;
}

export function hasImage(attrs: HeaderAttrs): boolean {
    return attrs[HeaderAttr.Background] === HeaderBackground.Image;
}

export function isTiled(attrs: HeaderAttrs): boolean {
    return hasImage(attrs) && attrs[HeaderAttr.Layout] === HeaderLayout.Tile;
}

const hasDecor = (attrs: HeaderAttrs, ...values: string[]) =>
    values.includes(attrs[HeaderAttr.Decor]);

/** Фигуры рисуются отдельными элементами, остальные слои — стилями. */
export function hasShapes(attrs: HeaderAttrs): boolean {
    return hasDecor(attrs, HeaderDecor.Mesh, HeaderDecor.Shapes);
}

export function isAttrUsed(attr: keyof HeaderAttrs, attrs: HeaderAttrs): boolean {
    switch (attr) {
        case HeaderAttr.Image:
        case HeaderAttr.Layout:
            return hasImage(attrs);
        case HeaderAttr.Fit:
        case HeaderAttr.Focus:
            return hasImage(attrs) && !isTiled(attrs);
        case HeaderAttr.Fill2:
            return hasDecor(attrs, HeaderDecor.Gradient, HeaderDecor.Mesh);
        case HeaderAttr.Direction:
            return hasDecor(attrs, HeaderDecor.Gradient);
        case HeaderAttr.Shape:
            return hasShapes(attrs);
        case HeaderAttr.Scale:
            return isTiled(attrs) || hasDecor(attrs, HeaderDecor.Pattern);
        default:
            return true;
    }
}

const quote = (value: string): string => `"${value.replace(/[\\"]/g, '\\$&')}"`;

/** Для будущего ВИЗИВИГ: пока заглушка печатает исходную разметку блока. */
export function serializeHeaderAttrs(raw: RawAttrs): string {
    const attrs = normalizeHeaderAttrs(raw);
    const pairs: string[] = [];
    for (const name of ATTR_ORDER) {
        if (!isAttrUsed(name, attrs)) continue;
        const value = attrs[name];
        if (!value || value === HeaderDefaults[name]) continue;
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
        color: choose(raw.color, Object.values(HeaderActionColor), HeaderActionColor.System),
    };
}
