import {log} from '@diplodoc/transform/lib/log.js';
import imsize from '@diplodoc/transform/lib/plugins/imsize/index.js';
import isNumber from 'is-number';
import type {NodeSpec} from 'prosemirror-model';

import type {ExtensionAuto} from '#core';

import {ImageSpecs} from '../../../markdown/Image/ImageSpecs';

import {ImgSizeAttr, imageNodeName} from './const';
import {imageToMarkdown, renderImgSizeExtra} from './utils';

export {ImgSizeAttr};

export type ImgSizeSpecsOptions = {
    /**
     * @deprecated use placeholder option in BehaviorPreset instead.
     */
    placeholder?: NodeSpec['placeholder'];
};

export const ImgSizeSpecs: ExtensionAuto<ImgSizeSpecsOptions> = (builder, opts) => {
    const placeholderContent = builder.context.get('placeholder')?.imgSize;

    if (!builder.hasNodeSpec(imageNodeName)) {
        builder.use(ImageSpecs);
    }

    builder.configureMd((md) => md.use(imsize, {log, enableInlineStyling: true}));

    builder.overrideNodeSpec(imageNodeName, (prev) => ({
        ...prev,
        attrs: {
            ...prev.attrs,
            [ImgSizeAttr.Height]: {default: null},
            [ImgSizeAttr.Width]: {default: null},
            [ImgSizeAttr.Id]: {default: null},
        },
        placeholder: placeholderContent ? {content: placeholderContent} : opts.placeholder,
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
                        [ImgSizeAttr.Loading]: (dom as Element).getAttribute(ImgSizeAttr.Loading),
                        [ImgSizeAttr.Height]: isNumber(height) ? height : null,
                        [ImgSizeAttr.Width]: isNumber(width) ? width : null,
                        [ImgSizeAttr.Id]: (dom as Element).getAttribute(ImgSizeAttr.Id),
                    };
                },
            },
        ],
    }));

    builder.overrideMarkdownTokenParserSpec(imageNodeName, (prev) => ({
        ...prev,
        getAttrs: (tok) => ({
            [ImgSizeAttr.Src]: tok.attrGet(ImgSizeAttr.Src)!,
            [ImgSizeAttr.Title]: tok.attrGet(ImgSizeAttr.Title),
            [ImgSizeAttr.Height]: tok.attrGet(ImgSizeAttr.Height),
            [ImgSizeAttr.Width]: tok.attrGet(ImgSizeAttr.Width),
            [ImgSizeAttr.Loading]: tok.attrGet(ImgSizeAttr.Loading),
            [ImgSizeAttr.Alt]: tok.children?.[0]?.content || null,
            [ImgSizeAttr.Id]: tok.attrGet(ImgSizeAttr.Id),
        }),
    }));

    builder.overrideNodeSerializerSpec(imageNodeName, () =>
        imageToMarkdown({renderExtra: renderImgSizeExtra}),
    );
};
