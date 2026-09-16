import type {HeaderAttrs} from './attrs';
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
    // Стабильный селектор для визуальных тестов: цепляться за классы вёрстки хрупко
    const dom: Record<string, string> = {class: HeaderClassName.Header, 'data-qa': 'g-md-header'};

    for (const [key, value] of Object.entries(attrs)) {
        dom[`data-${key}`] = String(value);
    }

    const image = attrs.bg === HeaderBackground.Image ? toCssUrl(attrs.image) : null;
    if (image) dom.style = `--g-md-header-image: ${image}`;
    // Сообщает CSS, что фон выбран, но картинки ещё нет — рисуется пунктирный слот
    if (attrs.bg === HeaderBackground.Image && !image) dom['data-image-empty'] = 'true';

    return dom;
}
