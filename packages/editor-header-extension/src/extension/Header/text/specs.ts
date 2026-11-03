import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    headerContentClassName,
    headerContentOpening,
    headerContentTokenName,
    headerTitleClassName,
    headerTitleDefaults,
    headerTitleDomAttrs,
    headerTitleTokenName,
    isHeaderTextColor,
    isHeaderTitleSize,
    normalizeHeaderTitleAttrs,
    serializeHeaderTitleOpening,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../i18n';

export const headerTitleNodeName = 'header_title';
export const headerContentNodeName = 'header_content';

/** A slot with one empty paragraph and default attributes is not written to Markdown. */
export function isEmptyHeaderSlot(node: Node) {
    const {firstChild} = node;
    const empty =
        node.childCount === 1 && firstChild?.type.name === 'paragraph' && !firstChild.childCount;
    if (node.type.name !== headerTitleNodeName) return empty;
    const {size, color} = normalizeHeaderTitleAttrs(node.attrs);
    return empty && size === headerTitleDefaults.size && color === headerTitleDefaults.color;
}

export const HeaderTextSpecs: ExtensionAuto = (builder) => {
    builder
        .addNodeSpec(headerTitleNodeName, () => ({
            content: 'block+',
            attrs: {
                size: {default: headerTitleDefaults.size},
                color: {default: headerTitleDefaults.color},
            },
            isolating: true,
            defining: true,
            selectable: false,
            parseDOM: [
                {
                    tag: `div.${headerTitleClassName}`,
                    getAttrs: (dom) => {
                        const size = dom.getAttribute('data-size') ?? headerTitleDefaults.size;
                        const color = dom.getAttribute('data-color') ?? headerTitleDefaults.color;
                        return isHeaderTitleSize(size) && isHeaderTextColor(color)
                            ? {size, color}
                            : false;
                    },
                },
            ],
            toDOM: (node) => ['div', headerTitleDomAttrs(node.attrs), 0],
            placeholder: {content: () => i18n('title-placeholder'), alwaysVisible: true},
        }))
        .addNodeSpec(headerContentNodeName, () => ({
            content: 'block+',
            isolating: true,
            defining: true,
            selectable: false,
            parseDOM: [{tag: `div.${headerContentClassName}`}],
            toDOM: () => ['div', {class: headerContentClassName}, 0],
            placeholder: {content: () => i18n('description-placeholder'), alwaysVisible: true},
        }))
        .addMarkdownTokenParserSpec(headerTitleTokenName, () => ({
            name: headerTitleNodeName,
            type: 'block',
            getAttrs: (token) => ({
                size: token.attrGet('data-size') ?? headerTitleDefaults.size,
                color: token.attrGet('data-color') ?? headerTitleDefaults.color,
            }),
        }))
        .addMarkdownTokenParserSpec(headerContentTokenName, () => ({
            name: headerContentNodeName,
            type: 'block',
        }))
        .addNodeSerializerSpec(headerTitleNodeName, () => (state, node) => {
            state.write(serializeHeaderTitleOpening(node.attrs));
            state.ensureNewLine();
            state.renderContent(node);
            state.flushClose(1);
            state.write(':::');
            state.closeBlock(node);
        })
        .addNodeSerializerSpec(headerContentNodeName, () => (state, node) => {
            state.write(headerContentOpening);
            state.ensureNewLine();
            state.renderContent(node);
            state.flushClose(1);
            state.write(':::');
            state.closeBlock(node);
        });
};
