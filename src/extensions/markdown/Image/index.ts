import {Action, createExtension, ExtensionAuto} from '../../../core';
import {addImage, AddImageAttrs} from './actions';
import {addImageAction, image, ImageAttr} from './const';

export {imgType} from './utils';
export type {AddImageAttrs} from './actions';

export const Image: ExtensionAuto = (builder) => {
    builder.addNode(image, () => ({
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
                name: image,
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

    builder.addAction(addImageAction, ({schema}) => addImage(schema));
};

/**
 * @deprecated
 * For tests only.
 * Remove after WIKI-16660
 */
export const ImageE = createExtension((b, o = {}) => b.use(Image, o));

declare global {
    namespace YfmEditor {
        interface Actions {
            [addImageAction]: Action<AddImageAttrs>;
        }
    }
}
