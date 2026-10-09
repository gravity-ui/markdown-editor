import type Token from 'markdown-it/lib/token';
import type {DOMOutputSpec, Node} from 'prosemirror-model';

import {type HeaderAttrs, normalizeHeaderAttrs} from './attrs';
import {HeaderAttr, HeaderClassName} from './const';
import {type HeaderShape, getHeaderShapes} from './decor';

const SAFE_SCHEMES = ['http:', 'https:', 'blob:', 'data:image/'];

export function toCssUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value) return null;
    const lower = value.toLowerCase();
    const absolute = /^[a-z][a-z0-9+.-]*:/.test(lower);
    if (absolute && !SAFE_SCHEMES.some((scheme) => lower.startsWith(scheme))) return null;
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
        if (name !== HeaderAttr.Image) dom[`data-${name}`] = String(value);
    }
    const image = toCssUrl(attrs[HeaderAttr.Image]);
    if (image) {
        dom['data-image'] = attrs[HeaderAttr.Image];
        dom.style = `--g-md-header-image:${image}`;
    }
    return dom;
}

const decorAttrs = {class: HeaderClassName.Decor, 'aria-hidden': 'true', contenteditable: 'false'};

export function headerToDOM(node: Node): DOMOutputSpec {
    const attrs = normalizeHeaderAttrs(node.attrs);
    const shapes: DOMOutputSpec[] = getHeaderShapes(attrs).map((shape) => [
        'span',
        shapeDomAttrs(shape),
    ]);
    const decor: DOMOutputSpec = ['span', decorAttrs, ...shapes];
    return ['div', headerDomAttrs(attrs), decor, ['div', {class: HeaderClassName.Content}, 0]];
}

const renderAttrs = (attrs: Record<string, string>, escape: (value: string) => string) =>
    Object.entries(attrs)
        .map(([name, value]) => ` ${name}="${escape(value)}"`)
        .join('');

export function headerHtmlOpen(attrs: HeaderAttrs, escape: (value: string) => string): string {
    const shapes = getHeaderShapes(attrs)
        .map((shape) => `<span${renderAttrs(shapeDomAttrs(shape), escape)}></span>`)
        .join('');
    return `<div${renderAttrs(headerDomAttrs(attrs), escape)}><span${renderAttrs(decorAttrs, escape)}>${shapes}</span><div class="${HeaderClassName.Content}">`;
}

export function headerHtmlClose(): string {
    return '</div></div>';
}

export function headerHtml(
    attrs: HeaderAttrs,
    title: string,
    escape: (value: string) => string,
): string {
    return `${headerHtmlOpen(attrs, escape)}<div class="${HeaderClassName.Title}">${escape(title)}</div>${headerHtmlClose()}`;
}

export function renderHeaderAction(token: Token, escape: (value: string) => string): string {
    const attrs = Object.fromEntries(token.attrs ?? []);
    const href = attrs.href ?? '';
    const type = attrs['data-type'] ?? 'button';
    const color = attrs['data-color'] ?? 'default';
    return `<a class="g-md-header__action" href="${escape(href)}" data-type="${escape(type)}" data-color="${escape(color)}">${escape(token.content)}</a>`;
}
