import type {HeaderAttrs} from './attrs';
import {HeaderBackground, HeaderClassName} from './const';

export function toCssUrl(raw: string): string | null {
    const url = raw.trim();
    if (!url) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^(?:https?|blob):/i.test(url)) return null;

    const escaped = url.replace(/["'()\\\s]/g, (character) =>
        encodeURIComponent(character).replace(
            /['()]/g,
            (delimiter) => `%${delimiter.charCodeAt(0).toString(16).toUpperCase()}`,
        ),
    );
    return `url("${escaped}")`;
}

export function headerDomAttrs(attrs: HeaderAttrs): Record<string, string> {
    const dom: Record<string, string> = {class: HeaderClassName.Header, 'data-qa': 'g-md-header'};

    for (const [key, value] of Object.entries(attrs)) {
        dom[`data-${key}`] = String(value);
    }

    const image = attrs.bg === HeaderBackground.Image ? toCssUrl(attrs.image) : null;
    if (image) dom.style = `--g-md-header-image: ${image}`;
    if (attrs.bg === HeaderBackground.Image && !image) dom['data-image-empty'] = 'true';

    return dom;
}
