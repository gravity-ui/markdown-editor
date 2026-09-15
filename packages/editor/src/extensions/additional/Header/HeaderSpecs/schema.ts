import type {NodeSpec} from '#pm/model';
import type {PlaceholderOptions} from 'src/utils/placeholder';

import {normalizeHeaderActionAttrs, normalizeHeaderAttrs} from './attrs';
import {
    HeaderActionAttr,
    HeaderActionDefaults,
    HeaderAttr,
    HeaderClassName,
    HeaderDefaults,
    HeaderNode,
    type HeaderNodeName,
} from './const';

const DEFAULT_PLACEHOLDERS = {
    Title: 'Header',
    Subtitle: 'Subtitle',
    Action: 'Button',
};

function attrsSpec<T extends Record<string, unknown>>(defaults: T): NodeSpec['attrs'] {
    return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, {default: value}]));
}

function dataAttrs(attrs: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(Object.entries(attrs).map(([key, value]) => [`data-${key}`, String(value)]));
}

export const getSchemaSpecs = (
    placeholder?: PlaceholderOptions,
): Record<HeaderNodeName, NodeSpec> => ({
    [HeaderNode.Header]: {
        attrs: attrsSpec(HeaderDefaults),
        // Жёсткая структура вместо опциональных детей: «непарных» состояний не существует,
        // поэтому и репарирующий appendTransaction не нужен. Пустота — это пустой контент слота.
        content: `${HeaderNode.Title} ${HeaderNode.Subtitle} ${HeaderNode.Actions}`,
        group: 'block',
        parseDOM: [
            {
                tag: `div.${HeaderClassName.Header}`,
                priority: 100,
                getAttrs: (node) => {
                    const raw: Record<string, string | null> = {};
                    for (const key of Object.values(HeaderAttr)) {
                        raw[key] = node.getAttribute(`data-${key}`);
                    }
                    return normalizeHeaderAttrs(raw);
                },
            },
        ],
        toDOM(node) {
            return ['div', {class: HeaderClassName.Header, ...dataAttrs(node.attrs)}, 0];
        },
        selectable: true,
        allowSelection: true,
        selectAll: 'node',
        defining: true,
        complex: 'root',
    },

    [HeaderNode.Title]: {
        content: 'inline*',
        group: 'block',
        parseDOM: [{tag: `div.${HeaderClassName.Title}`}],
        toDOM() {
            return ['div', {class: HeaderClassName.Title}, 0];
        },
        placeholder: {
            content: placeholder?.[HeaderNode.Title] ?? DEFAULT_PLACEHOLDERS.Title,
            alwaysVisible: true,
        },
        definingAsContext: true,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [HeaderNode.Subtitle]: {
        content: 'inline*',
        group: 'block',
        parseDOM: [{tag: `div.${HeaderClassName.Subtitle}`}],
        toDOM() {
            return ['div', {class: HeaderClassName.Subtitle}, 0];
        },
        placeholder: {
            content: placeholder?.[HeaderNode.Subtitle] ?? DEFAULT_PLACEHOLDERS.Subtitle,
            alwaysVisible: true,
        },
        definingAsContext: true,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [HeaderNode.Actions]: {
        // `*`, а не `+`: hero без кнопок — штатное состояние, и схема не должна требовать заглушку
        content: `${HeaderNode.Action}*`,
        group: 'block',
        parseDOM: [{tag: `div.${HeaderClassName.Actions}`}],
        toDOM() {
            return ['div', {class: HeaderClassName.Actions}, 0];
        },
        isolating: true,
        selectable: false,
        allowSelection: false,
        selectAll: false,
        complex: 'inner',
    },

    [HeaderNode.Action]: {
        attrs: attrsSpec(HeaderActionDefaults),
        content: 'inline*',
        marks: '',
        parseDOM: [
            {
                tag: `a.${HeaderClassName.Action}`,
                getAttrs: (node) =>
                    normalizeHeaderActionAttrs({
                        [HeaderActionAttr.Href]: node.getAttribute('href'),
                        [HeaderActionAttr.Variant]: node.getAttribute('data-variant'),
                    }),
            },
        ],
        toDOM(node) {
            return [
                'a',
                {
                    class: HeaderClassName.Action,
                    href: node.attrs[HeaderActionAttr.Href] || null,
                    'data-variant': node.attrs[HeaderActionAttr.Variant],
                },
                0,
            ];
        },
        placeholder: {
            content: placeholder?.[HeaderNode.Action] ?? DEFAULT_PLACEHOLDERS.Action,
            alwaysVisible: true,
        },
        defining: true,
        selectable: false,
        allowSelection: false,
        selectionContext: false,
        complex: 'leaf',
    },
});
