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
            Object.values(HeaderAttr).map((attr) => [attr, element.getAttribute(`data-${attr}`)]),
        ),
    );

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
