import type {DOMOutputSpec, Node} from '#pm/model';

import {type HeaderAttrs, normalizeHeaderAttrs, normalizeHeaderImageAttrs} from './attrs';
import {HeaderClassName, HeaderImageDefaults} from './const';
import {type HeaderShape, getHeaderShapes} from './decor';

export function safeImageUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))
        return null;
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^(?:https?:|blob:)/i.test(value)) return null;
    return value;
}
export function toCssUrl(raw: string): string | null {
    const value = safeImageUrl(raw);
    if (!value) return null;
    return `url("${value.replace(/["'()\\\s]/g, (char) => encodeURIComponent(char).replace(/[!'()*]/g, (part) => `%${part.charCodeAt(0).toString(16).toUpperCase()}`))}")`;
}
const percent = (value: number) => `${Number((value * 100).toFixed(2))}%`;
const shapeDomAttrs = (shape: HeaderShape) => ({
    class: HeaderClassName.Shape,
    style: `--g-md-header-shape-size:${percent(shape.size)};--g-md-header-shape-x:${percent(shape.x)};--g-md-header-shape-y:${percent(shape.y)};--g-md-header-shape-opacity:${shape.opacity};--g-md-header-shape-duration:${shape.duration}s;--g-md-header-shape-delay:${shape.delay}s`,
});
export function headerDomAttrs(attrs: HeaderAttrs): Record<string, string> {
    const dom: Record<string, string> = {class: HeaderClassName.Root, 'data-qa': 'header'};
    for (const [name, value] of Object.entries(attrs)) dom[`data-${name}`] = value;
    const image = toCssUrl(attrs.image);
    if (image && attrs['image-enabled'] === 'true') dom.style = `--g-md-header-image:${image}`;
    return dom;
}
function contentAttrs(attrs: HeaderAttrs): Record<string, string> {
    const theme = attrs['bg-image-theme'];
    const fixed =
        Boolean(safeImageUrl(attrs.image)) &&
        attrs['image-enabled'] === 'true' &&
        theme !== 'system';
    return {class: `${HeaderClassName.Content}${fixed ? ` g-root g-root_theme_${theme}` : ''}`};
}
export function mediaDomAttrs(raw: Readonly<Record<string, unknown>>): Record<string, string> {
    const attrs = normalizeHeaderImageAttrs(raw);
    return {
        class: HeaderClassName.Media,
        'data-src': safeImageUrl(attrs.src) ?? '',
        'data-alt': attrs.alt,
        'data-name': attrs.name,
        'data-enabled': attrs.enabled,
    };
}
export function mediaToDOM(raw: Readonly<Record<string, unknown>>): DOMOutputSpec {
    const attrs = mediaDomAttrs(raw);
    return [
        'div',
        attrs,
        ...(attrs['data-src']
            ? [
                  [
                      'img',
                      {
                          class: HeaderClassName.Image,
                          src: attrs['data-src'],
                          alt: attrs['data-alt'],
                      },
                  ] as DOMOutputSpec,
              ]
            : []),
    ];
}
const decorAttrs = {class: HeaderClassName.Decor, 'aria-hidden': 'true', contenteditable: 'false'};
export function headerToDOM(node: Node): DOMOutputSpec {
    const attrs = normalizeHeaderAttrs(node.attrs);
    return [
        'div',
        headerDomAttrs(attrs),
        [
            'span',
            decorAttrs,
            ...getHeaderShapes(attrs).map((shape): DOMOutputSpec => ['span', shapeDomAttrs(shape)]),
        ],
        ['div', {class: 'g-md-header__container'}, ['div', contentAttrs(attrs), 0]],
    ];
}
const renderAttrs = (attrs: Record<string, string>, escape: (value: string) => string) =>
    Object.entries(attrs)
        .map(([key, value]) => ` ${key}="${escape(value)}"`)
        .join('');
export function headerHtmlOpen(attrs: HeaderAttrs, escape: (value: string) => string): string {
    const shapes = getHeaderShapes(attrs)
        .map((shape) => `<span${renderAttrs(shapeDomAttrs(shape), escape)}></span>`)
        .join('');
    return `<div${renderAttrs(headerDomAttrs(attrs), escape)}><span${renderAttrs(decorAttrs, escape)}>${shapes}</span><div class="g-md-header__container"><div${renderAttrs(contentAttrs(attrs), escape)}>`;
}
export const headerHtmlClose = () => '</div></div></div>';
export function headerHtml(
    attrs: HeaderAttrs,
    title: string,
    escape: (value: string) => string,
): string {
    return `${headerHtmlOpen(attrs, escape)}<div class="${HeaderClassName.Title}">${escape(title)}</div>${headerHtmlClose()}`;
}
export {HeaderImageDefaults};
