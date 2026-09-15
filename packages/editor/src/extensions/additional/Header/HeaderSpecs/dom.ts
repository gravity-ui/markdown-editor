import type {DOMOutputSpec} from '#pm/model';

import type {HeaderAttrs} from './attrs';
import {getBlobs} from './blobs';
import {HeaderBackground, HeaderClassName} from './const';

/**
 * Значение атрибута приходит из markdown, то есть от постороннего автора, и попадает прямо
 * в `style`. Кавычки, скобки и переводы строк позволяют закрыть `url()` и дописать своё правило,
 * поэтому они кодируются, а схемы кроме http(s)/относительных путей отбрасываются целиком.
 */
export function toCssUrl(raw: string): string | null {
    const url = raw.trim();
    if (!url) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^https?:/i.test(url)) return null;

    const escaped = url.replace(/["'()\\\s]/g, encodeURIComponent);
    return `url("${escaped}")`;
}

export function headerDomAttrs(attrs: HeaderAttrs): Record<string, string> {
    const dom: Record<string, string> = {class: HeaderClassName.Header};

    for (const [key, value] of Object.entries(attrs)) {
        dom[`data-${key}`] = String(value);
    }

    const image = attrs.bg === HeaderBackground.Image ? toCssUrl(attrs.image) : null;
    if (image) dom.style = `--g-md-header-image: ${image}`;
    // Сообщает CSS, что фон выбран, но картинки ещё нет — рисуется пунктирный слот
    if (attrs.bg === HeaderBackground.Image && !image) dom['data-image-empty'] = 'true';

    return dom;
}

/** Декоративный слой — чистая функция от `seed`/`format`, поэтому живёт в `toDOM` без нодвью. */
export function headerDecorDom(attrs: HeaderAttrs): DOMOutputSpec | null {
    if (!attrs.blobs || attrs.bg === HeaderBackground.Image) return null;

    const shapes = getBlobs(attrs.seed, attrs.format).map((blob): DOMOutputSpec => {
        const style = [
            `width:${blob.width}px`,
            `height:${blob.height}px`,
            `right:${blob.right}px`,
            blob.top === undefined ? `bottom:${blob.bottom}px` : `top:${blob.top}px`,
            `border-radius:${blob.radius}`,
            `transform:rotate(${blob.rotate}deg)`,
        ].join(';');
        return ['span', {class: `${HeaderClassName.Header}-shape`, style}];
    });

    return ['div', {class: `${HeaderClassName.Header}-decor`, 'aria-hidden': 'true'}, ...shapes];
}
