import type {ExtensionAuto} from '#core';

import {
    ButtonAttr,
    buttonActionClassName,
    buttonClassName,
    buttonDirectiveName,
    buttonNodeName,
    buttonTokenName,
} from './const';
import {buttonDirective} from './md';

export * from './const';
export {buttonDirective} from './md';

const hrefDataAttr = `data-${ButtonAttr.Href}`;

const escapeLabel = (label: string) => label.replace(/[\\[\]]/g, '\\$&');
const escapeHref = (href: string) => href.replace(/[\\()]/g, '\\$&');

export const ButtonSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(buttonDirective))
        .addNodeSpec(buttonNodeName, () => ({
            atom: true,
            group: 'block',
            selectable: true,
            attrs: {
                [ButtonAttr.Label]: {default: ''},
                [ButtonAttr.Href]: {default: ''},
            },
            parseDOM: [
                {
                    tag: `div.${buttonClassName}`,
                    getAttrs: (dom) => {
                        const action = (dom as Element).querySelector(`.${buttonActionClassName}`);
                        return {
                            [ButtonAttr.Label]: action?.textContent ?? '',
                            [ButtonAttr.Href]:
                                action?.getAttribute(hrefDataAttr) ??
                                action?.getAttribute('href') ??
                                '',
                        };
                    },
                },
            ],
            // Без `href`: ссылка внутри нередактируемого узла открывалась бы по клику.
            toDOM: (node) => [
                'div',
                {class: buttonClassName},
                [
                    'span',
                    {class: buttonActionClassName, [hrefDataAttr]: node.attrs[ButtonAttr.Href]},
                    node.attrs[ButtonAttr.Label],
                ],
            ],
        }))
        .addMarkdownTokenParserSpec(buttonTokenName, () => ({
            name: buttonNodeName,
            type: 'node',
            getAttrs: (token) => ({
                [ButtonAttr.Label]: token.content,
                [ButtonAttr.Href]: token.attrGet('href') ?? '',
            }),
        }))
        .addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
            const label = escapeLabel(node.attrs[ButtonAttr.Label]);
            const href = escapeHref(node.attrs[ButtonAttr.Href]);
            state.write(`::${buttonDirectiveName}[${label}](${href})`);
            state.closeBlock(node);
        });
};
