import {
    type LeafBlockDirectiveHandler,
    directiveParser,
    registerContainerDirective,
    registerLeafBlockDirective,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';
import type Core from 'markdown-it/lib/parser_core';

import {normalizeLinkUrl} from '../url';

import {bannerAttrs, bannerTitleAttrs} from './attrs';
import {
    bannerContentClassName,
    bannerContentTokenName,
    bannerTitleTokenName,
    bannerTokenName,
} from './const';
import {isBareContainer} from './utils';

const bannerTitleHandler: LeafBlockDirectiveHandler = (state, params) => {
    if (!params.inlineContent || params.dests) return false;
    const text = state.md.utils.unescapeMd(params.inlineContent.raw).trim();
    const open = state.push(`${bannerTitleTokenName}_open`, 'div', 1);
    open.map = [params.startLine, params.endLine];
    open.markup = '::banner-title';
    open.attrs = Object.entries(bannerTitleAttrs(params.attrs ?? {}));
    open.hidden = !text;
    if (text) state.push('text', '', 0).content = text;
    state.push(`${bannerTitleTokenName}_close`, 'div', -1).hidden = open.hidden;
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
    md.core.ruler.push(`${bannerContentTokenName}_hide_empty`, hideEmptyContent);
};
