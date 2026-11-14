import {
    directiveParser,
    registerContainerDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {headerContentAttrs} from './attrs';
import {headerContentTokenName} from './const';

const openTokenName = `${headerContentTokenName}_open`;
const closeTokenName = `${headerContentTokenName}_close`;

export const headerContentPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, headerContentTokenName, (state, params) => {
        if (params.inlineContent || params.dests || params.contentTitle) return false;
        const token = state.push(openTokenName, 'div', 1);
        token.map = [params.startLine, params.endLine];
        token.markup = `:::${headerContentTokenName}`;
        token.attrs = Object.entries(headerContentAttrs(params.attrs ?? {}));
        tokenizeBlockContent(state, params.content, `${headerContentTokenName}-directive`);
        state.push(closeTokenName, 'div', -1);
        return true;
    });
    const {rules} = md.renderer;
    // A description without a text keeps its tokens and renders nothing.
    rules[openTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx + 1]?.type === closeTokenName ? '' : self.renderToken(tokens, idx, options);
    rules[closeTokenName] = (tokens, idx, options, _env, self) =>
        tokens[idx - 1]?.type === openTokenName ? '' : self.renderToken(tokens, idx, options);
};
