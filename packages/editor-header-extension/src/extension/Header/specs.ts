import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    headerClassName,
    headerContentClassName,
    headerDefaults,
    headerDimensions,
    headerDomAttrs,
    headerPlugin,
    headerTextDefaults,
    headerTextDomAttrs,
    headerTextMarkupAttrs,
    headerTitleClassName,
    headerTokenName,
    isHeaderHeight,
    isHeaderWidth,
    normalizeHeaderTextAttrs,
    stringifyAttrs,
} from '@gravity-ui/markdown-plugin-header';

import {HeaderSourceSpecs} from './source';
import {
    HeaderTextSpecs,
    headerContentNodeName,
    headerTitleNodeName,
    isEmptyHeaderSlot,
} from './text/specs';

export const headerNodeName = 'header';

const isHeaderSlotElement = (child: ChildNode) =>
    child.nodeType === child.ELEMENT_NODE &&
    [headerTitleClassName, headerContentClassName].some((name) =>
        (child as Element).classList.contains(name),
    );

export const HeaderSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => md.use(headerPlugin))
        .addNodeSpec(headerNodeName, () => ({
            group: 'block',
            content: `${headerTitleNodeName} ${headerContentNodeName}`,
            selectable: true,
            isolating: true,
            defining: true,
            attrs: {
                height: {default: headerDefaults.height},
                width: {default: headerDefaults.width},
                title: {default: headerTextDefaults.title},
                description: {default: headerTextDefaults.description},
            },
            parseDOM: [
                {
                    tag: `div.${headerClassName}`,
                    getAttrs: (dom) => {
                        const height = dom.getAttribute('data-height') ?? headerDefaults.height;
                        const width = dom.getAttribute('data-width') ?? headerDefaults.width;
                        return Array.from(dom.childNodes).every(isHeaderSlotElement) &&
                            isHeaderHeight(height) &&
                            isHeaderWidth(width)
                            ? {
                                  height,
                                  width,
                                  ...normalizeHeaderTextAttrs({
                                      title: dom.getAttribute('data-title'),
                                      description: dom.getAttribute('data-description'),
                                  }),
                              }
                            : false;
                    },
                },
            ],
            toDOM: (node) => [
                'div',
                {...headerDomAttrs(node.attrs), ...headerTextDomAttrs(node.attrs)},
                0,
            ],
        }))
        .addMarkdownTokenParserSpec(headerTokenName, () => ({
            name: headerNodeName,
            type: 'block',
            getAttrs: (token) => ({
                height: token.attrGet('data-height'),
                width: token.attrGet('data-width'),
                ...normalizeHeaderTextAttrs({
                    title: token.attrGet('data-title'),
                    description: token.attrGet('data-description'),
                }),
            }),
        }))
        .addNodeSerializerSpec(headerNodeName, () => (state, node) => {
            const attrs = {...headerDimensions(node.attrs), ...headerTextMarkupAttrs(node.attrs)};
            const slots: Node[] = [];
            node.forEach((slot) => {
                if (!isEmptyHeaderSlot(slot)) slots.push(slot);
            });
            state.write(`:::header${stringifyAttrs(attrs)}`);
            if (slots.length) state.closeBlock(node);
            else state.ensureNewLine();
            slots.forEach((slot, index) => state.render(slot, node, index));
            state.write(':::');
            state.closeBlock(node);
        });

    builder.use(HeaderTextSpecs).use(HeaderSourceSpecs);
};
