import isNumber from 'is-number';
import type {NodeSpec} from 'prosemirror-model';
import imsize from '@diplodoc/transform/lib/plugins/imsize';
import log from '@diplodoc/transform/lib/log';

import type {ExtensionAuto} from '../../../../core';
import {imageNodeName} from '../../../markdown/Image/const';
import {ImgSizeAttr} from './const';

type ImsizeTypedAttributes = {
    [ImgSizeAttr.Src]: string;
    [ImgSizeAttr.Title]: string | null;
    [ImgSizeAttr.Alt]: string | null;
    [ImgSizeAttr.Width]: string | null;
    [ImgSizeAttr.Height]: string | null;
    [ImgSizeAttr.Loading]: string | null;
};

export {ImgSizeAttr};

export type ImgSizeSpecsOptions = {
    /**
     * @deprecated: use placeholder option in BehaviorPreset instead.
     */
    placeholder?: NodeSpec['placeholder'];
};

export const ImgSizeSpecs: ExtensionAuto<ImgSizeSpecsOptions> = (builder, opts) => {
    const placeholderContent = builder.context.get('placeholder')?.imgSize;

    builder.configureMd((md) => md.use(imsize, {log}));
    builder.addNode(imageNodeName, () => ({
        spec: {
            inline: true,
            attrs: {
                [ImgSizeAttr.Src]: {},
                [ImgSizeAttr.Alt]: {default: null},
                [ImgSizeAttr.Title]: {default: null},
                [ImgSizeAttr.Height]: {default: null},
                [ImgSizeAttr.Width]: {default: null},
                [ImgSizeAttr.Loading]: {default: null},
            },
            placeholder: placeholderContent ? {content: placeholderContent} : opts.placeholder,
            group: 'inline',
            draggable: true,
            parseDOM: [
                {
                    tag: 'img[src]',
                    getAttrs(dom) {
                        const height = (dom as Element).getAttribute(ImgSizeAttr.Height);
                        const width = (dom as Element).getAttribute(ImgSizeAttr.Width);

                        return {
                            [ImgSizeAttr.Src]: (dom as Element).getAttribute(ImgSizeAttr.Src),
                            [ImgSizeAttr.Alt]: (dom as Element).getAttribute(ImgSizeAttr.Alt),
                            [ImgSizeAttr.Title]: (dom as Element).getAttribute(ImgSizeAttr.Title),
                            [ImgSizeAttr.Loading]: (dom as Element).getAttribute(
                                ImgSizeAttr.Loading,
                            ),
                            [ImgSizeAttr.Height]: isNumber(height) ? height : null,
                            [ImgSizeAttr.Width]: isNumber(width) ? height : null,
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
                getAttrs: (tok): ImsizeTypedAttributes => ({
                    [ImgSizeAttr.Src]: tok.attrGet(ImgSizeAttr.Src)!,
                    [ImgSizeAttr.Title]: tok.attrGet(ImgSizeAttr.Title),
                    [ImgSizeAttr.Height]: tok.attrGet(ImgSizeAttr.Height),
                    [ImgSizeAttr.Width]: tok.attrGet(ImgSizeAttr.Width),
                    [ImgSizeAttr.Loading]: tok.attrGet(ImgSizeAttr.Loading),
                    [ImgSizeAttr.Alt]: tok.children?.[0]?.content || null,
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
};

function getSize({width, height}: ImsizeTypedAttributes): string {
    if (width || height) {
        return ` =${width || ''}x${height || ''}`;
    }

    return '';
}
