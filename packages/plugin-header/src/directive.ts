import {directiveParser, registerContainerDirective} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {headerClassNames} from './classname';
import {headerTokenName} from './const';
import {headerDimensions} from './dimensions';

export const headerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, {
        name: 'header',
        match: ({inlineContent, dests, contentTitle}) => !inlineContent && !dests && !contentTitle,
        container: {
            tag: 'div',
            token: headerTokenName,
            attrs: ({attrs}) => ({class: headerClassNames(attrs ?? {})}),
            meta: ({attrs}) => headerDimensions(attrs ?? {}),
        },
    });
};
