import type {NodeSpec} from '#pm/model';
import type {PlaceholderOptions} from 'src/utils/placeholder';

import {normalizeHeaderAttrs, normalizeHeaderImageAttrs, normalizeHeaderTitleAttrs} from './attrs';
import {
    HeaderClassName,
    HeaderDefaults,
    HeaderImageDefaults,
    HeaderTitleDefaults,
    headerActionsName,
    headerContentName,
    headerImageName,
    headerNodeName,
    headerTitleName,
} from './const';
import {headerToDOM, mediaToDOM, titleDomAttrs} from './dom';

export const getHeaderSchemaSpec = (): NodeSpec => ({
    content: `${headerTitleName} ${headerContentName} ${headerActionsName} ${headerImageName}`,
    group: 'block',
    dnd: {props: {offset: [8, 1]}},
    attrs: Object.fromEntries(
        Object.entries(HeaderDefaults).map(([key, value]) => [key, {default: value}]),
    ),
    parseDOM: [
        {
            tag: `div.${HeaderClassName.Root}`,
            getAttrs: (dom) =>
                normalizeHeaderAttrs(
                    Object.fromEntries(
                        Object.keys(HeaderDefaults).map((key) => [
                            key,
                            (dom as Element).getAttribute(`data-${key}`),
                        ]),
                    ),
                ),
        },
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
    attrs: Object.fromEntries(
        Object.entries(HeaderTitleDefaults).map(([key, value]) => [key, {default: value}]),
    ),
    parseDOM: [
        {
            tag: `div.${HeaderClassName.Title}`,
            preserveWhitespace: 'full',
            getAttrs: (dom) =>
                normalizeHeaderTitleAttrs({
                    size: (dom as Element).getAttribute('data-size'),
                    color: (dom as Element).getAttribute('data-color'),
                }),
        },
    ],
    toDOM: (node) => ['div', titleDomAttrs(node.attrs), 0],
    selectable: false,
    allowSelection: false,
    selectionContext: false,
    placeholder: {content: placeholder?.[headerNodeName] ?? 'Your title', alwaysVisible: true},
    complex: 'inner',
});
export const getHeaderContentSpec = (placeholder?: () => string): NodeSpec => ({
    content: '(paragraph | heading)+',
    parseDOM: [{tag: `div.${HeaderClassName.Body}`}],
    toDOM: () => ['div', {class: HeaderClassName.Body}, 0],
    selectable: false,
    complex: 'inner',
    placeholder: {
        content:
            placeholder ??
            'A short description of the page: what it covers and who it is for. Readers will see these lines first.',
        alwaysVisible: true,
    },
});
export const headerContentSpec = getHeaderContentSpec();
export const headerActionsSpec: NodeSpec = {
    content: 'button{0,3}',
    parseDOM: [{tag: `div.${HeaderClassName.Actions}`}],
    toDOM: () => ['div', {class: HeaderClassName.Actions}, 0],
    selectable: false,
    complex: 'inner',
};
export const headerImageSpec: NodeSpec = {
    atom: true,
    attrs: Object.fromEntries(
        Object.entries(HeaderImageDefaults).map(([key, value]) => [key, {default: value}]),
    ),
    parseDOM: [
        {
            tag: `div.${HeaderClassName.Media}`,
            getAttrs: (dom) =>
                normalizeHeaderImageAttrs(
                    Object.fromEntries(
                        Object.keys(HeaderImageDefaults).map((key) => [
                            key,
                            (dom as Element).getAttribute(`data-${key}`),
                        ]),
                    ),
                ),
        },
    ],
    toDOM: (node) => mediaToDOM(node.attrs),
    selectable: false,
    complex: 'leaf',
};
