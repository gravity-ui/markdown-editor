import type {DOMOutputSpec, Node} from 'prosemirror-model';

import {type HeaderAttrs, hasImage, normalizeHeaderAttrs} from './attrs';
import {HeaderAttr, HeaderClassName} from './const';
import {type HeaderShape, getHeaderShapes} from './decor';

const SAFE_SCHEMES = ['http:', 'https:', 'blob:', 'data:image/'];

/** Ссылка попадает в `url()`, поэтому кавычки, скобки и переводы строк кодируются, а схема проверяется. */
export function toCssUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value) return null;

    const lower = value.toLowerCase();
    const absolute = /^[a-z][a-z0-9+.-]*:/.test(lower);
    if (absolute && !SAFE_SCHEMES.some((scheme) => lower.startsWith(scheme))) return null;

    const escaped = value.replace(/["'()\\\s]/g, encodeURIComponent);
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

const decorDomAttrs = {
    class: HeaderClassName.Decor,
    'aria-hidden': 'true',
    contenteditable: 'false',
};

export function headerDomAttrs(attrs: HeaderAttrs): Record<string, string> {
    const dom: Record<string, string> = {
        class: HeaderClassName.Root,
        'data-qa': 'header',
        'data-format': attrs[HeaderAttr.Format],
        'data-bg': attrs[HeaderAttr.Background],
        'data-fill': attrs[HeaderAttr.Fill],
        'data-fill2': attrs[HeaderAttr.Fill2],
        'data-text': attrs[HeaderAttr.Text],
        'data-seed': String(attrs[HeaderAttr.Seed]),
    };

    const url = toCssUrl(attrs[HeaderAttr.Image]);
    if (url) {
        dom['data-image'] = attrs[HeaderAttr.Image];
        dom['data-effect'] = attrs[HeaderAttr.Effect];
        dom.style = `--g-md-header-image:${url}`;
    }

    return dom;
}

/** Фигуры принадлежат слою фона, поэтому под изображением не рисуются. */
function visibleShapes(attrs: HeaderAttrs): HeaderShape[] {
    return hasImage(attrs) ? [] : getHeaderShapes(attrs);
}

export function headerToDOM(node: Node): DOMOutputSpec {
    const attrs = normalizeHeaderAttrs(node.attrs);
    const shapes: DOMOutputSpec[] = visibleShapes(attrs).map((shape) => [
        'span',
        shapeDomAttrs(shape),
    ]);
    const content: DOMOutputSpec = [
        'div',
        {class: HeaderClassName.Content},
        ['div', {class: HeaderClassName.Title}, 0],
    ];

    if (!shapes.length) return ['div', headerDomAttrs(attrs), content];

    return ['div', headerDomAttrs(attrs), ['span', decorDomAttrs, ...shapes], content];
}

const renderAttrs = (attrs: Record<string, string>, escape: (value: string) => string) =>
    Object.entries(attrs)
        .map(([name, value]) => ` ${name}="${escape(value)}"`)
        .join('');

/** Markup-режим рисует блок сам: у токена директивы нет закрывающей пары, дефолтный рендерер оставил бы `div` открытым. */
export function headerHtml(
    attrs: HeaderAttrs,
    title: string,
    escape: (value: string) => string,
): string {
    const shapes = visibleShapes(attrs)
        .map((shape) => `<span${renderAttrs(shapeDomAttrs(shape), escape)}></span>`)
        .join('');
    const decor = shapes ? `<span${renderAttrs(decorDomAttrs, escape)}>${shapes}</span>` : '';

    return (
        `<div${renderAttrs(headerDomAttrs(attrs), escape)}>` +
        decor +
        `<div class="${HeaderClassName.Content}">` +
        `<div class="${HeaderClassName.Title}">${escape(title)}</div>` +
        `</div></div>`
    );
}
