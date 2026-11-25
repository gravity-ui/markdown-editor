import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {normalizeLinkUrl} from '../url';

import {bannerAttrs} from './attrs';
import {bannerTokenName} from './const';

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
};
