import {
    directiveParser,
    registerContainerDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {directiveRawAttr} from '../directive';

import {headerAttrs} from './attrs';
import {headerTokenName} from './const';

export const headerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, headerTokenName, (state, params) => {
        if (params.inlineContent || params.dests || params.contentTitle) return false;
        const attrs = params.attrs ?? {};
        // The address is taken as written: the directive parser decodes HTML entities.
        // A repeated attribute is a list of values and counts as unsupported.
        const image =
            typeof attrs['bg-image'] === 'string'
                ? directiveRawAttr(
                      md,
                      state.src.slice(
                          state.bMarks[params.startLine] + state.tShift[params.startLine],
                          state.eMarks[params.startLine],
                      ),
                      'bg-image',
                  )
                : undefined;
        const token = state.push(`${headerTokenName}_open`, 'div', 1);
        token.map = [params.startLine, params.endLine];
        token.markup = `:::${headerTokenName}`;
        token.attrs = Object.entries(headerAttrs({...attrs, 'bg-image': image}));
        tokenizeBlockContent(state, params.content, `${headerTokenName}-directive`);
        state.push(`${headerTokenName}_close`, 'div', -1);
        return true;
    });
};
