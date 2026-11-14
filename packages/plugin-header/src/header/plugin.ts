import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {headerAttrs} from './attrs';
import {headerTokenName} from './const';

export const headerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: 'header',
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {
            tag: 'div',
            token: headerTokenName,
            attrs: ({attrs}) => headerAttrs(attrs ?? {}),
        },
    });
};
