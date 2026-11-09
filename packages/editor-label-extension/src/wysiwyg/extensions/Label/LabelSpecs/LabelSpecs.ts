import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {DOMOutputSpec} from '@gravity-ui/markdown-editor/pm/model';
import {
    defaultLabelColor,
    labelAttrs,
    labelClassName,
    labelCn,
    labelColorFromAttrs,
    labelDirectiveName,
    labelPlugin,
    labelTokenName,
    normalizeLabelColor,
} from '@gravity-ui/markdown-plugin-label';

import {i18n} from '../../../../i18n';

import {LabelAttr, labelNodeName} from './const';

/**
 * Escapes brackets, backslashes, table pipes and ampersands that start an HTML entity.
 * A line break becomes a space, so the label stays inside its table row.
 */
const escapeLabelText = (text: string) =>
    text.replace(/\r\n?|\n/g, ' ').replace(/[\\[\]|]|&(?=[a-z#][a-z0-9]{1,31};)/gi, '\\$&');

/** Spans keep the label valid inside a paragraph; the placeholder stays out of the text. */
const labelDomSpec = (color: unknown, text: string): DOMOutputSpec => [
    'span',
    labelAttrs(color),
    [
        'span',
        {
            class: labelCn('text'),
            ...(text
                ? {}
                : {
                      'data-placeholder': i18n('default_caption'),
                      'aria-label': i18n('default_caption'),
                  }),
        },
        text,
    ],
];

export const LabelSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(labelPlugin))
        .addNodeSpec(labelNodeName, () => ({
            inline: true,
            atom: true,
            group: 'inline',
            selectable: true,
            allowSelection: true,
            fakeCursor: true,
            leafText: (node) => node.attrs[LabelAttr.Text],
            attrs: {
                [LabelAttr.Text]: {default: ''},
                [LabelAttr.Color]: {default: defaultLabelColor},
            },
            parseDOM: [
                {
                    tag: `span.${labelClassName}`,
                    getAttrs: (dom) => ({
                        [LabelAttr.Text]: dom.textContent ?? '',
                        [LabelAttr.Color]: labelColorFromAttrs((name) => dom.getAttribute(name)),
                    }),
                },
            ],
            toDOM: (node) => labelDomSpec(node.attrs[LabelAttr.Color], node.attrs[LabelAttr.Text]),
        }))
        .addMarkdownTokenParserSpec(labelTokenName, () => ({
            name: labelNodeName,
            type: 'node',
            getAttrs: (token) => ({
                [LabelAttr.Text]: token.content,
                [LabelAttr.Color]: labelColorFromAttrs((name) => token.attrGet(name)),
            }),
        }))
        .addNodeSerializerSpec(labelNodeName, () => (state, node) => {
            const text = escapeLabelText(node.attrs[LabelAttr.Text]);
            if (!text.trim()) return;

            const color = normalizeLabelColor(node.attrs[LabelAttr.Color]);
            const attrs = color === defaultLabelColor ? '' : `{color=${color}}`;
            state.write(`:${labelDirectiveName}[${text}]${attrs}`);
        });
};
