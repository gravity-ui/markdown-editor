import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

export const imageNodeName = 'image';
export const imageType = nodeTypeFactory(imageNodeName);

export const ImageAttr = {
    Src: 'src',
    Alt: 'alt',
    Title: 'title',
} as const;

export const ImageSpecs: ExtensionAuto = (builder) => {
    builder.addNode(imageNodeName, () => ({
        spec: {
            inline: true,
            attrs: {
                [ImageAttr.Src]: {},
                [ImageAttr.Alt]: {default: null},
                [ImageAttr.Title]: {default: null},
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
                        };
                    },
                },
            ],
            toDOM(node) {
                return ['img', node.attrs];
            },
        },
        fromYfm: {
            tokenSpec: {
                name: imageNodeName,
                type: 'node',
                getAttrs: (tok) => ({
                    [ImageAttr.Src]: tok.attrGet('src'),
                    [ImageAttr.Title]: tok.attrGet('title') || null,
                    [ImageAttr.Alt]: tok.children?.[0]?.content || null,
                }),
            },
        },
        toYfm: (state, {attrs}) => {
            state.write(
                '![' +
                    state.esc(attrs.alt || '') +
                    '](' +
                    state.esc(attrs.src) +
                    (attrs.title ? ' ' + state.quote(attrs.title) : '') +
                    ')',
            );
        },
    }));
};
