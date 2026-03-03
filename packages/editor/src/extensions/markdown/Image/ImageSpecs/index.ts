import type {ExtensionAuto} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

export const imageNodeName = 'image';
export const imageType = nodeTypeFactory(imageNodeName);

export const ImageAttr = {
    Src: 'src',
    Alt: 'alt',
    Title: 'title',
    Loading: 'loading',
} as const;

export const ImageSpecs: ExtensionAuto = (builder) => {
    builder.addNode(imageNodeName, () => ({
        spec: {
            inline: true,
            attrs: {
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
                return ['img', node.attrs];
            },
        },
        fromMd: {
            tokenSpec: {
                name: imageNodeName,
                type: 'node',
                getAttrs: (tok) => ({
                    [ImageAttr.Src]: tok.attrGet('src'),
                    [ImageAttr.Title]: tok.attrGet('title') || null,
                    [ImageAttr.Loading]: tok.attrGet(ImageAttr.Loading) || null,
                    [ImageAttr.Alt]: tok.children?.[0]?.content || null,
                }),
            },
        },
        toMd: (state, {attrs}) => {
            let result = '![';

            if (attrs.alt) {
                result += state.esc(attrs.alt);
            }

            result += '](';

            if (attrs.src) {
                result += state.esc(attrs.src);
            }

            if (attrs.title) {
                result += ` ${state.quote(attrs.title)}`;
            }

            result += ')';

            state.write(result);
        },
    }));
};
