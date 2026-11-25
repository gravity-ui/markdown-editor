import {
    type LeafBlockDirectiveHandler,
    directiveParser,
    registerContainerDirective,
    registerLeafBlockDirective,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {normalizeLinkUrl} from '../url';

import {bannerAttrs, bannerTitleAttrs} from './attrs';
import {bannerTitleTokenName, bannerTokenName} from './const';

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

export const bannerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: 'banner',
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {
            tag: 'div',
            token: bannerTokenName,
            attrs: ({attrs = {}}) =>
                bannerAttrs({...attrs, 'bg-image': normalizeLinkUrl(md, attrs['bg-image'])}),
        },
    });
    registerLeafBlockDirective(md, 'banner-title', bannerTitleHandler);
};
