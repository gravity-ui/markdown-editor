import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    sectionAttrs,
    sectionBackground,
    sectionClassName,
    sectionColumnAttrs,
    sectionColumnClassName,
    sectionColumnContentClassName,
    sectionColumnSize,
    sectionColumnTokenName,
    sectionDefaults,
    sectionGridSize,
    sectionMaxColumns,
    sectionPlugin,
    sectionSettings,
    sectionTokenName,
} from '@gravity-ui/markdown-plugin-section';

import {sectionColumnNodeName, sectionNodeName} from './const';

export const SectionSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(sectionPlugin))
        .addNodeSpec(sectionNodeName, () => ({
            group: 'block',
            content: `${sectionColumnNodeName}{1,${sectionMaxColumns}}`,
            defining: true,
            isolating: true,
            attrs: {
                padding: {default: sectionDefaults.padding},
                rounded: {default: sectionDefaults.rounded},
                gap: {default: sectionDefaults.gap},
            },
            parseDOM: [
                {
                    tag: `div.${sectionClassName}`,
                    getAttrs: (dom) =>
                        sectionSettings({
                            padding: dom.getAttribute('data-padding'),
                            rounded: dom.getAttribute('data-rounded'),
                            gap: dom.getAttribute('data-gap'),
                        }),
                },
            ],
            toDOM: (node) => ['div', sectionAttrs(node.attrs), 0],
        }))
        .addNodeSpec(sectionColumnNodeName, () => ({
            content: 'block+',
            isolating: true,
            selectable: false,
            attrs: {
                size: {default: sectionGridSize},
                background: {default: 'none'},
            },
            parseDOM: [
                {
                    tag: `div.${sectionColumnClassName}`,
                    contentElement: `.${sectionColumnContentClassName}`,
                    getAttrs: (dom) => ({
                        size: sectionColumnSize(dom.getAttribute('data-size')),
                        background: sectionBackground(dom.getAttribute('data-background')),
                    }),
                },
            ],
            toDOM: (node) => [
                'div',
                sectionColumnAttrs(node.attrs),
                ['div', {class: sectionColumnContentClassName}, 0],
            ],
        }))
        .addMarkdownTokenParserSpec(sectionTokenName, () => ({
            name: sectionNodeName,
            type: 'block',
            getAttrs: (token) =>
                sectionSettings({
                    padding: token.attrGet('data-padding'),
                    rounded: token.attrGet('data-rounded'),
                    gap: token.attrGet('data-gap'),
                }),
        }))
        .addMarkdownTokenParserSpec(sectionColumnTokenName, () => ({
            name: sectionColumnNodeName,
            type: 'block',
            getAttrs: (token) => ({
                size: sectionColumnSize(token.attrGet('data-size')),
                background: sectionBackground(token.attrGet('data-background')),
            }),
        }))
        .addNodeSerializerSpec(sectionNodeName, () => (state, node) => {
            const {padding, gap, rounded} = sectionSettings(node.attrs);
            const roundedAttr = rounded ? ' rounded="true"' : '';
            state.write(`::::section{padding="${padding}" gap="${gap}"${roundedAttr}}`);
            state.closeBlock(node);
            state.renderContent(node);
            state.write('::::');
            state.closeBlock(node);
        })
        .addNodeSerializerSpec(sectionColumnNodeName, () => (state, node) => {
            const {size, background} = node.attrs;
            state.write(
                `:::column{size="${sectionColumnSize(size)}" background="${sectionBackground(background)}"}`,
            );
            state.closeBlock(node);
            state.renderContent(node);
            state.write(':::');
            state.closeBlock(node);
        });
};

export const sectionNodeType = (schema: Schema) => schema.nodes[sectionNodeName];
export const sectionColumnNodeType = (schema: Schema) => schema.nodes[sectionColumnNodeName];
