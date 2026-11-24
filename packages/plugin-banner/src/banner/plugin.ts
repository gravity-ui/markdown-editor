import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {bannerAttrs} from './attrs';
import {bannerTokenName} from './model';

export const bannerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: 'banner',
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {
            tag: 'div',
            token: bannerTokenName,
            attrs: ({attrs}) => bannerAttrs(attrs ?? {}),
        },
    });
};
