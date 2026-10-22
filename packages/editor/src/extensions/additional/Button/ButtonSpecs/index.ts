import type {ExtensionAuto} from '#core';

import {
    buttonActionDomAttrs,
    buttonColorDataAttr,
    buttonTargetDataAttr,
    buttonViewDataAttr,
    normalizeButtonStyle,
    normalizeButtonTarget,
} from './attrs';
import {
    BUTTON_DEFAULT_VIEW,
    ButtonAttr,
    ButtonColor,
    buttonActionClassName,
    buttonClassName,
    buttonDirectiveName,
    buttonNodeName,
    buttonTokenName,
} from './const';
import {buttonDirective} from './md';

export * from './attrs';
export * from './const';
export {buttonDirective} from './md';

const hrefDataAttr = `data-${ButtonAttr.Href}`;

const escapeLabel = (label: string) => label.replace(/[\\[\]]/g, '\\$&');
const escapeHref = (href: string) => href.replace(/[\\()]/g, '\\$&');

const serializeAttrs = (attrs: Record<string, string>) => {
    const pairs = [
        attrs[ButtonAttr.View] === BUTTON_DEFAULT_VIEW
            ? ''
            : `${ButtonAttr.View}=${attrs[ButtonAttr.View]}`,
        attrs[ButtonAttr.Color] === ButtonColor.Default
            ? ''
            : `${ButtonAttr.Color}=${attrs[ButtonAttr.Color]}`,
        attrs[ButtonAttr.Target] ? `${ButtonAttr.Target}=${attrs[ButtonAttr.Target]}` : '',
    ].filter(Boolean);
    return pairs.length ? `{${pairs.join(' ')}}` : '';
};

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
                [ButtonAttr.View]: {default: BUTTON_DEFAULT_VIEW},
                [ButtonAttr.Color]: {default: ButtonColor.Default},
                [ButtonAttr.Target]: {default: ''},
            },
            parseDOM: [
                {
                    tag: `div.${buttonClassName}`,
                    getAttrs: (dom) => {
                        const action = (dom as Element).querySelector(`.${buttonActionClassName}`);
                        const style = normalizeButtonStyle(
                            action?.getAttribute(buttonViewDataAttr),
                            action?.getAttribute(buttonColorDataAttr),
                        );
                        return {
                            [ButtonAttr.Label]: action?.textContent ?? '',
                            [ButtonAttr.Href]:
                                action?.getAttribute(hrefDataAttr) ??
                                action?.getAttribute('href') ??
                                '',
                            [ButtonAttr.View]: style.view,
                            [ButtonAttr.Color]: style.color,
                            [ButtonAttr.Target]: normalizeButtonTarget(
                                action?.getAttribute(buttonTargetDataAttr) ??
                                    action?.getAttribute('target'),
                            ),
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
                    {
                        ...buttonActionDomAttrs(
                            normalizeButtonStyle(
                                node.attrs[ButtonAttr.View],
                                node.attrs[ButtonAttr.Color],
                            ),
                        ),
                        [hrefDataAttr]: node.attrs[ButtonAttr.Href],
                        [buttonTargetDataAttr]: node.attrs[ButtonAttr.Target],
                    },
                    node.attrs[ButtonAttr.Label],
                ],
            ],
        }))
        .addMarkdownTokenParserSpec(buttonTokenName, () => ({
            name: buttonNodeName,
            type: 'node',
            getAttrs: (token) => ({
                [ButtonAttr.Label]: token.content,
                [ButtonAttr.Href]: token.attrGet(ButtonAttr.Href) ?? '',
                [ButtonAttr.View]: token.attrGet(buttonViewDataAttr),
                [ButtonAttr.Color]: token.attrGet(buttonColorDataAttr),
                [ButtonAttr.Target]: token.attrGet(buttonTargetDataAttr) ?? '',
            }),
        }))
        .addNodeSerializerSpec(buttonNodeName, () => (state, node) => {
            const label = escapeLabel(node.attrs[ButtonAttr.Label]);
            const href = escapeHref(node.attrs[ButtonAttr.Href]);
            state.write(`::${buttonDirectiveName}[${label}](${href})${serializeAttrs(node.attrs)}`);
            state.closeBlock(node);
        });
};
