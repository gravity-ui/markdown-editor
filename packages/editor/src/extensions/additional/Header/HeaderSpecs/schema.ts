import type {NodeSpec} from '#pm/model';
import type {PlaceholderOptions} from 'src/utils/placeholder';

import {normalizeHeaderAttrs} from './attrs';
import {HeaderAttr, HeaderClassName, HeaderDefaults, headerNodeName} from './const';
import {headerToDOM} from './dom';

const DEFAULT_PLACEHOLDER = 'Header title';

const attrsSpec: NodeSpec['attrs'] = Object.fromEntries(
    Object.entries(HeaderDefaults).map(([name, value]) => [name, {default: value}]),
);

const readDomAttrs = (element: Element) =>
    normalizeHeaderAttrs(
        Object.fromEntries(
            Object.values(HeaderAttr).map((attr) => [
                attr,
                element.getAttribute(`data-${attr}`) ??
                    (attr === HeaderAttr.Image ? readImageUrl(element) : undefined),
            ]),
        ),
    );

/** Ссылка живёт в `style`, а не в атрибуте: копипаст между страницами читает её оттуда. */
function readImageUrl(element: Element): string {
    const style = (element as HTMLElement).style?.getPropertyValue('--g-md-header-image') ?? '';
    return style.match(/url\(["']?(.*?)["']?\)/)?.[1] ?? '';
}

export const getHeaderSchemaSpec = (placeholder?: PlaceholderOptions): NodeSpec => ({
    content: 'text*',
    marks: '',
    group: 'block',
    attrs: attrsSpec,
    parseDOM: [
        {
            tag: `div.${HeaderClassName.Root}`,
            contentElement: `.${HeaderClassName.Title}`,
            getAttrs: (dom) => readDomAttrs(dom as Element),
        },
    ],
    toDOM: headerToDOM,
    placeholder: {
        content: placeholder?.[headerNodeName] ?? DEFAULT_PLACEHOLDER,
        alwaysVisible: true,
    },
    selectable: true,
    allowSelection: true,
    selectAll: 'node',
    defining: true,
    complex: 'root',
    commandMenu: false,
    // Контекстное меню выделения предлагает марки, которых у заголовка нет.
    selectionContext: false,
});
