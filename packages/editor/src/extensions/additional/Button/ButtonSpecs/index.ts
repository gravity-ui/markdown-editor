import type {ExtensionAuto} from '#core';
import type {NodeSpec} from '#pm/model';
import {writeDirectiveLines} from 'src/utils/directive-container';

import {
    buttonClassName,
    buttonDefaults,
    buttonDomAttrs,
    escapePlainContent,
    normalizeButtonAttrs,
    serializeAttrs,
} from './attrs';
import {buttonDirective} from './md';

export * from './attrs';
export {buttonDirective} from './md';

export const buttonSpec: NodeSpec = {
    atom: true,
    group: 'block',
    attrs: Object.fromEntries(
        Object.entries(buttonDefaults).map(([key, value]) => [key, {default: value}]),
    ),
    parseDOM: [
        {
            tag: `a.${buttonClassName}`,
            priority: 100,
            getAttrs: (element) => {
                const dom = element as Element;
                return normalizeButtonAttrs({
                    label: dom.textContent,
                    href: dom.getAttribute('href'),
                    view: dom.getAttribute('data-view'),
                    color: dom.getAttribute('data-color'),
                    enabled: dom.getAttribute('data-enabled'),
                    'new-tab': dom.getAttribute('target') === '_blank',
                });
            },
        },
    ],
    toDOM: (node) => ['a', buttonDomAttrs(node.attrs), node.attrs.label],
    complex: 'leaf',
};

export const ButtonSpecs: ExtensionAuto = (builder) => {
    if (builder.context.get('buttonSpecsRegistered')) return;
    builder.context.set('buttonSpecsRegistered', true);
    builder.configureMd((md) => md.use(buttonDirective));
    builder
        .addNodeSpec('button', () => buttonSpec)
        .addMarkdownTokenParserSpec('button', () => ({
            name: 'button',
            type: 'node',
            getAttrs: (token) => normalizeButtonAttrs(Object.fromEntries(token.attrs ?? [])),
        }))
        .addNodeSerializerSpec('button', () => (state, node) => {
            const attrs = normalizeButtonAttrs(node.attrs);
            const {label: _, ...defaults} = buttonDefaults;
            writeDirectiveLines(
                state,
                `:::button${serializeAttrs(attrs, defaults)}\n${escapePlainContent(attrs.label)}`,
            );
            state.write(':::');
            state.closeBlock(node);
        });
};

declare global {
    namespace WysiwygEditor {
        interface Context {
            buttonSpecsRegistered: boolean;
            buttonViewRegistered: boolean;
        }
    }
}
