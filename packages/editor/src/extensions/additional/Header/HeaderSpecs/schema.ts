import type {NodeSpec} from '#pm/model';
import {i18n} from 'src/i18n/header';
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
import {headerDomAttrs} from './dom';

function attrsSpec<T extends Record<string, unknown>>(defaults: T): NodeSpec['attrs'] {
    return Object.fromEntries(
        Object.entries(defaults).map(([key, value]) => [key, {default: value}]),
    );
}

/** Resolve placeholders lazily to support later configuration and locale changes. */
function placeholderFor(
    node: HeaderNodeName,
    fallback: () => string,
    placeholder?: PlaceholderOptions,
): NonNullable<NodeSpec['placeholder']> {
    return {
        content: (...args) => {
            const own = placeholder?.[node];
            if (typeof own === 'function') return own(...args);
            return own ?? fallback();
        },
        alwaysVisible: true,
    };
}

export const getSchemaSpecs = (
    placeholder?: PlaceholderOptions,
): Record<HeaderNodeName, NodeSpec> => ({
    [HeaderNode.Header]: {
        attrs: attrsSpec(HeaderDefaults),
        // Slots always exist; their content may be empty.
        content: `${HeaderNode.Title} ${HeaderNode.Description} ${HeaderNode.Actions}`,
        group: 'block',
        parseDOM: [
            {
                tag: `div.${HeaderClassName.Header}`,
                priority: 100,
                contentElement: `.${HeaderClassName.Content}`,
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
            return [
                'div',
                headerDomAttrs(normalizeHeaderAttrs(node.attrs)),
                ['div', {class: HeaderClassName.Content}, 0],
            ];
        },
        selectable: true,
        allowSelection: true,
        selectAll: 'node',
        defining: true,
        complex: 'root',
    },

    // Empty marks disable formatting without depending on marks from a preset.
    [HeaderNode.Title]: {
        content: 'text*',
        marks: '',
        parseDOM: [{tag: `div.${HeaderClassName.Title}`}],
        toDOM() {
            return ['div', {class: HeaderClassName.Title}, 0];
        },
        placeholder: placeholderFor(HeaderNode.Title, () => i18n('placeholder.title'), placeholder),
        commandMenu: false,
        definingAsContext: true,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [HeaderNode.Description]: {
        content: 'text*',
        marks: '',
        parseDOM: [{tag: `div.${HeaderClassName.Description}`}],
        toDOM() {
            return ['div', {class: HeaderClassName.Description}, 0];
        },
        placeholder: placeholderFor(
            HeaderNode.Description,
            () => i18n('placeholder.description'),
            placeholder,
        ),
        commandMenu: false,
        definingAsContext: true,
        selectable: false,
        allowSelection: false,
        complex: 'leaf',
    },

    [HeaderNode.Actions]: {
        content: `${HeaderNode.Action}*`,
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
        content: 'text*',
        marks: '',
        parseDOM: [
            {
                tag: `a.${HeaderClassName.Action}`,
                getAttrs: (node) =>
                    normalizeHeaderActionAttrs({
                        [HeaderActionAttr.Type]: node.getAttribute(`data-${HeaderActionAttr.Type}`),
                        [HeaderActionAttr.Href]: node.getAttribute(HeaderActionAttr.Href),
                        [HeaderActionAttr.Color]: node.getAttribute(
                            `data-${HeaderActionAttr.Color}`,
                        ),
                    }),
            },
        ],
        toDOM(node) {
            return [
                'a',
                {
                    class: HeaderClassName.Action,
                    href: node.attrs[HeaderActionAttr.Href] || null,
                    [`data-${HeaderActionAttr.Type}`]: node.attrs[HeaderActionAttr.Type],
                    [`data-${HeaderActionAttr.Color}`]: node.attrs[HeaderActionAttr.Color],
                },
                // Keep editable text in normal flow inside the flex button.
                ['span', 0],
            ];
        },
        placeholder: placeholderFor(
            HeaderNode.Action,
            () => i18n('placeholder.action'),
            placeholder,
        ),
        commandMenu: false,
        defining: true,
        selectable: false,
        allowSelection: false,
        selectionContext: false,
        complex: 'leaf',
    },
});
