import {
    type LeafBlockDirectiveHandler,
    directiveParser,
    registerContainerDirective,
    registerLeafBlockDirective,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';

import {normalizeLinkUrl} from '../url';

import {bannerAttrs, bannerImageAttrs, bannerTitleAttrs} from './attrs';
import {
    bannerContentClassName,
    bannerContentTokenName,
    bannerImageTokenName,
    bannerTitleTokenName,
    bannerTokenName,
} from './const';
import {bannerTitle, isBareContainer} from './utils';

const bannerTitleHandler: LeafBlockDirectiveHandler = (state, params) => {
    if (!params.inlineContent || params.dests) return false;
    const text = state.md.utils.unescapeMd(params.inlineContent.raw).trim();
    const tag = `h${bannerTitle(params.attrs ?? {}).size}`;
    const open = state.push(`${bannerTitleTokenName}_open`, tag, 1);
    open.map = [params.startLine, params.endLine];
    open.markup = '::banner-title';
    open.attrs = Object.entries(bannerTitleAttrs(params.attrs ?? {}));
    open.hidden = !text;
    if (text) state.push('text', '', 0).content = text;
    state.push(`${bannerTitleTokenName}_close`, tag, -1).hidden = open.hidden;
    return true;
};

const bannerImageHandler: LeafBlockDirectiveHandler = (state, params) => {
    const {inlineContent, dests, contentTitle} = params;
    if (contentTitle) return false;
    let attrs = params.attrs ?? {};
    if (inlineContent || dests) {
        if (!inlineContent || !dests || params.attrs) return false;
        attrs = {
            src: dests.link ?? '',
            alt: state.md.utils.unescapeAll(inlineContent.raw),
            title: dests.string ?? '',
        };
    }
    const src = normalizeLinkUrl(state.md, attrs.src);
    const token = state.push(bannerImageTokenName, 'img', 0);
    token.map = [params.startLine, params.endLine];
    token.markup = '::banner-image';
    token.attrs = Object.entries(bannerImageAttrs({...attrs, src}));
    token.hidden = !src;
    return true;
};

const contentOpenTokenName = `${bannerContentTokenName}_open`;
const contentCloseTokenName = `${bannerContentTokenName}_close`;

const hideEmptyContent: Core.RuleCore = ({tokens}) => {
    tokens.forEach((token, idx) => {
        const close = tokens[idx + 1];
        if (token.type === contentOpenTokenName && close?.type === contentCloseTokenName) {
            token.hidden = true;
            close.hidden = true;
        }
    });
};

export const bannerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: 'banner',
        match: isBareContainer,
        container: {
            tag: 'div',
            token: bannerTokenName,
            attrs: ({attrs = {}}) =>
                bannerAttrs({...attrs, 'bg-image': normalizeLinkUrl(md, attrs['bg-image'])}),
        },
    });
    registerLeafBlockDirective(md, 'banner-title', bannerTitleHandler);
    registerContainerDirective(md, {
        name: 'banner-content',
        match: isBareContainer,
        container: {
            tag: 'div',
            token: bannerContentTokenName,
            attrs: {class: bannerContentClassName},
        },
    });
    registerLeafBlockDirective(md, 'banner-image', bannerImageHandler);
    md.core.ruler.push(`${bannerContentTokenName}_hide_empty`, hideEmptyContent);
};
