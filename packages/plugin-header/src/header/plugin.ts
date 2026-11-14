import {
    directiveParser,
    registerContainerDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {blockDirectiveLine, directiveRawAttrs} from '../directive';

import {headerAttrs} from './attrs';
import {headerTokenName} from './const';

export const headerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, headerTokenName, (state, params) => {
        if (params.inlineContent || params.dests || params.contentTitle) return false;
        const attrs = params.attrs ?? {};
        // The address is taken as written: the directive parser decodes HTML entities.
        const {'bg-image': image} = directiveRawAttrs(
            md,
            blockDirectiveLine(state, params.startLine),
            attrs,
            ['bg-image'],
        );
        const token = state.push(`${headerTokenName}_open`, 'div', 1);
        token.map = [params.startLine, params.endLine];
        token.markup = `:::${headerTokenName}`;
        token.attrs = Object.entries(headerAttrs({...attrs, 'bg-image': image}));
        tokenizeBlockContent(state, params.content, `${headerTokenName}-directive`);
        state.push(`${headerTokenName}_close`, 'div', -1);
        return true;
    });
};
