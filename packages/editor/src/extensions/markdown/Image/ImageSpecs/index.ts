import type {ExtensionAuto} from '#core';
import {nodeTypeFactory} from 'src/utils/schema';

import {pasteResourceId} from '../../../../paste/tracking';

import {ImageAttr, imageNodeName} from './const';
import {imageToMarkdown} from './utils';

export {ImageAttr, imageNodeName} from './const';
export {imageToMarkdown, type ImageToMarkdownParams} from './utils';

export const imageType = nodeTypeFactory(imageNodeName);

export const ImageSpecs: ExtensionAuto = (builder) => {
    builder
        .addNodeSpec(imageNodeName, () => ({
            inline: true,
            attrs: {
                [pasteResourceId]: {default: null},
                [ImageAttr.Src]: {},
                [ImageAttr.Alt]: {default: null},
                [ImageAttr.Title]: {default: null},
                [ImageAttr.Loading]: {default: null},
            },
            group: 'inline',
            draggable: true,
            parseDOM: [
                {
                    tag: 'img[src]',
                    getAttrs(dom) {
                        return {
                            [ImageAttr.Src]: (dom as Element).getAttribute(ImageAttr.Src),
                            [ImageAttr.Alt]: (dom as Element).getAttribute(ImageAttr.Alt),
                            [ImageAttr.Title]: (dom as Element).getAttribute(ImageAttr.Title),
                            [ImageAttr.Loading]: (dom as Element).getAttribute(ImageAttr.Loading),
                        };
                    },
                },
            ],
            toDOM(node) {
                const attrs = {...node.attrs};
                delete attrs[pasteResourceId];
                return ['img', attrs];
            },
        }))
        .addMarkdownTokenParserSpec(imageNodeName, () => ({
            name: imageNodeName,
            type: 'node',
            getAttrs: (tok) => ({
                [ImageAttr.Src]: tok.attrGet('src'),
                [ImageAttr.Title]: tok.attrGet('title') || null,
                [ImageAttr.Loading]: tok.attrGet(ImageAttr.Loading) || null,
                [ImageAttr.Alt]: tok.children?.[0]?.content || null,
            }),
        }))
        .addNodeSerializerSpec(imageNodeName, () => imageToMarkdown());
};
