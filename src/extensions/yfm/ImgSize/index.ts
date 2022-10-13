import isNumber from 'is-number';
import type {NodeSpec} from 'prosemirror-model';
import imsize from '@doc-tools/transform/lib/plugins/imsize';
import {ImsizeAttr} from '@doc-tools/transform/lib/plugins/imsize/const';
import log from '@doc-tools/transform/lib/log';

import type {Action, ExtensionAuto} from '../../../core';
import {addImageAction, image} from './const';
import {addImage, AddImageAttrs} from './actions';

type ImsizeTypedAttributes = {
    [ImsizeAttr.Src]: string;
    [ImsizeAttr.Title]: string | null;
    [ImsizeAttr.Alt]: string | null;
    [ImsizeAttr.Width]: string | null;
    [ImsizeAttr.Height]: string | null;
};

export {ImageAttr} from './const';

export type ImgSizeOptions = {
    placeholder?: NodeSpec['placeholder'];
};

export const ImgSize: ExtensionAuto<ImgSizeOptions> = (builder, opts) => {
    builder.configureMd((md) => md.use(imsize, {log}));
    builder.addNode(image, () => ({
        spec: {
            inline: true,
            attrs: {
                [ImsizeAttr.Src]: {},
                [ImsizeAttr.Alt]: {default: null},
                [ImsizeAttr.Title]: {default: null},
                [ImsizeAttr.Height]: {default: null},
                [ImsizeAttr.Width]: {default: null},
            },
            placeholder: opts.placeholder,
            group: 'inline',
            draggable: true,
            parseDOM: [
                {
                    tag: 'img[src]',
                    getAttrs(dom) {
                        const height = (dom as Element).getAttribute(ImsizeAttr.Height);
                        const width = (dom as Element).getAttribute(ImsizeAttr.Width);

                        return {
                            [ImsizeAttr.Src]: (dom as Element).getAttribute(ImsizeAttr.Src),
                            [ImsizeAttr.Alt]: (dom as Element).getAttribute(ImsizeAttr.Alt),
                            [ImsizeAttr.Title]: (dom as Element).getAttribute(ImsizeAttr.Title),
                            [ImsizeAttr.Height]: isNumber(height) ? height : null,
                            [ImsizeAttr.Width]: isNumber(width) ? height : null,
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
                getAttrs: (tok): ImsizeTypedAttributes => ({
                    [ImsizeAttr.Src]: tok.attrGet(ImsizeAttr.Src)!,
                    [ImsizeAttr.Title]: tok.attrGet(ImsizeAttr.Title),
                    [ImsizeAttr.Height]: tok.attrGet(ImsizeAttr.Height),
                    [ImsizeAttr.Width]: tok.attrGet(ImsizeAttr.Width),
                    [ImsizeAttr.Alt]: tok.children?.[0]?.content || null,
                }),
            },
        },
        toYfm: (state, node) => {
            const attrs = node.attrs as ImsizeTypedAttributes;
            state.write(
                '![' +
                    state.esc(attrs.alt || '') +
                    '](' +
                    state.esc(attrs.src) +
                    (attrs.title ? ' ' + state.quote(attrs.title) : '') +
                    getSize(attrs) +
                    ')',
            );
        },
    }));

    builder.addAction(addImageAction, ({schema}) => addImage(schema));
};

declare global {
    namespace YfmEditor {
        interface Actions {
            // @ts-expect-error
            [addImageAction]: Action<AddImageAttrs>;
        }
    }
}

function getSize({width, height}: ImsizeTypedAttributes): string {
    if (width || height) {
        return ` =${width || ''}x${height || ''}`;
    }

    return '';
}
