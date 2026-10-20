import type {HeaderActionAttrs, HeaderAttrs, HeaderImageAttrs} from './attrs';
import {HeaderAttr, HeaderClassName} from './const';
import {type HeaderShape, getHeaderShapes} from './decor';

type Escape = (value: string) => string;

const SAFE_SCHEMES = ['http:', 'https:', 'blob:', 'data:image/'];

/** Адрес без схемы или со схемой из белого списка. `data:` допускается только для изображений. */
export function toSafeUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value) return null;
    const lower = value.toLowerCase();
    const absolute = /^[a-z][a-z0-9+.-]*:/.test(lower);
    if (absolute && !SAFE_SCHEMES.some((scheme) => lower.startsWith(scheme))) return null;
    return value;
}

export function toCssUrl(raw: string): string | null {
    const value = toSafeUrl(raw);
    if (!value) return null;
    const escaped = value.replace(/["'()\\\s]/g, (char) =>
        encodeURIComponent(char).replace(
            /[!'()*]/g,
            (punctuation) => `%${punctuation.charCodeAt(0).toString(16).toUpperCase()}`,
        ),
    );
    return `url("${escaped}")`;
}

const percent = (value: number) => `${Number((value * 100).toFixed(2))}%`;

function shapeDomAttrs(shape: HeaderShape): Record<string, string> {
    const style = [
        `width:${percent(shape.size)}`,
        `left:${percent(shape.x)}`,
        `top:${percent(shape.y)}`,
        `opacity:${shape.opacity}`,
        `--g-md-header-shape-duration:${shape.duration}s`,
        `--g-md-header-shape-delay:${shape.delay}s`,
    ].join(';');
    const attrs: Record<string, string> = {class: HeaderClassName.Shape, style};
    if (shape.fill) attrs['data-fill'] = shape.fill;
    return attrs;
}

export function headerDomAttrs(attrs: HeaderAttrs): Record<string, string> {
    const dom: Record<string, string> = {class: HeaderClassName.Root, 'data-qa': 'header'};
    for (const [name, value] of Object.entries(attrs)) {
        if (name !== HeaderAttr.Image) dom[`data-${name}`] = value;
    }
    const image = toCssUrl(attrs[HeaderAttr.Image]);
    if (image) {
        dom['data-image'] = attrs[HeaderAttr.Image];
        dom.style = `--g-md-header-image:${image}`;
    }
    return dom;
}

const decorAttrs = {class: HeaderClassName.Decor, 'aria-hidden': 'true', contenteditable: 'false'};

const renderAttrs = (attrs: Record<string, string>, escape: Escape) =>
    Object.entries(attrs)
        .map(([name, value]) => ` ${name}="${escape(value)}"`)
        .join('');

export function headerHtmlOpen(attrs: HeaderAttrs, escape: Escape): string {
    const shapes = getHeaderShapes(attrs)
        .map((shape) => `<span${renderAttrs(shapeDomAttrs(shape), escape)}></span>`)
        .join('');
    return `<div${renderAttrs(headerDomAttrs(attrs), escape)}><span${renderAttrs(decorAttrs, escape)}>${shapes}</span><div class="${HeaderClassName.Content}">\n`;
}

export function headerHtmlClose(): string {
    return '</div></div>\n';
}

export function headerTitleHtml(text: string, size: number, escape: Escape): string {
    return `<h${size} class="${HeaderClassName.Title}">${escape(text)}</h${size}>\n`;
}

export type HeaderImage = HeaderImageAttrs & {src: string; alt: string};

export function headerImageHtml(image: HeaderImage, escape: Escape): string {
    const media = renderAttrs(
        {
            class: HeaderClassName.Media,
            'data-side': image.side,
            'data-fit': image.fit,
            'data-focus': image.focus,
        },
        escape,
    );
    const img = renderAttrs({class: HeaderClassName.Image, src: image.src, alt: image.alt}, escape);
    return `<div${media}><img${img} /></div>\n`;
}

export type HeaderAction = HeaderActionAttrs & {href: string; text: string};

export function headerActionHtml(action: HeaderAction, escape: Escape): string {
    const attrs = renderAttrs(
        {
            class: HeaderClassName.Action,
            href: action.href,
            'data-type': action.type,
            'data-color': action.color,
        },
        escape,
    );
    return `<a${attrs}>${escape(action.text)}</a>`;
}
