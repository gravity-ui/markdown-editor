import type {NodeSpec} from '#pm/model';
import type {PlaceholderOptions} from 'src/utils/placeholder';

import {normalizeHeaderAttrs} from './attrs';
import {
    HeaderAttr,
    HeaderClassName,
    HeaderDefaults,
    headerActionsName,
    headerContentName,
    headerNodeName,
    headerTitleName,
} from './const';
import {headerToDOM} from './dom';

const attrsSpec: NodeSpec['attrs'] = Object.fromEntries(
    Object.entries(HeaderDefaults).map(([name, value]) => [name, {default: value}]),
);

const readDomAttrs = (element: Element) =>
    normalizeHeaderAttrs(
        Object.fromEntries(
            Object.values(HeaderAttr).map((attr) => [attr, element.getAttribute(`data-${attr}`)]),
        ),
    );

export const getHeaderSchemaSpec = (): NodeSpec => ({
    content: `${headerTitleName} ${headerContentName} ${headerActionsName}`,
    group: 'block',
    attrs: attrsSpec,
    parseDOM: [
        {tag: `div.${HeaderClassName.Root}`, getAttrs: (dom) => readDomAttrs(dom as Element)},
    ],
    toDOM: headerToDOM,
    selectable: true,
    defining: true,
    isolating: true,
    complex: 'root',
    commandMenu: false,
});

export const getHeaderTitleSpec = (placeholder?: PlaceholderOptions): NodeSpec => ({
    content: 'text*',
    marks: '',
    parseDOM: [{tag: `div.${HeaderClassName.Title}`}],
    toDOM: () => ['div', {class: HeaderClassName.Title}, 0],
    selectable: false,
    allowSelection: true,
    selectionContext: false,
    placeholder: {
        content: placeholder?.[headerNodeName] ?? 'Header title',
        alwaysVisible: true,
    },
    complex: 'inner',
});

export const headerContentSpec: NodeSpec = {
    content: 'paragraph*',
    parseDOM: [{tag: `div.${headerContentName}`}],
    toDOM: () => ['div', {class: headerContentName}, 0],
    selectable: false,
    complex: 'inner',
};

export const headerActionsSpec: NodeSpec = {
    content: 'header_action*',
    parseDOM: [{tag: `div.${headerActionsName}`}],
    toDOM: () => ['div', {class: headerActionsName}, 0],
    selectable: false,
    complex: 'inner',
};

export const headerActionSpec: NodeSpec = {
    content: 'text*',
    marks: '',
    group: 'block',
    attrs: {href: {default: ''}, type: {default: 'button'}, color: {default: 'default'}},
    parseDOM: [
        {
            tag: 'a.g-md-header__action',
            getAttrs: (dom) => ({
                href: (dom as Element).getAttribute('href') ?? '',
                type: (dom as Element).getAttribute('data-type') ?? 'button',
                color: (dom as Element).getAttribute('data-color') ?? 'default',
            }),
        },
    ],
    toDOM: (node) => [
        'a',
        {
            class: 'g-md-header__action',
            href: node.attrs.href,
            'data-type': node.attrs.type,
            'data-color': node.attrs.color,
        },
        0,
    ],
    selectable: false,
    complex: 'leaf',
};
