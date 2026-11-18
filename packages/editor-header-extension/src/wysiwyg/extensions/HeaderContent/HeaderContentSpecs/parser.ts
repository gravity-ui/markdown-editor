import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {
    headerContentPlugin,
    headerContentTokenName,
    headerTokenName,
} from '@gravity-ui/markdown-plugin-header';

import {headerContentNodeName} from './const';

const headerContentOpen = `${headerContentTokenName}_open`;
const headerOpen = `${headerTokenName}_open`;

export const HeaderContentParserSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => {
            md.use(headerContentPlugin).core.ruler.push('header_content_unwrap', (state) => {
                // The schema allows one description directly in a banner; others become their blocks.
                const parents: {type: string; unwrap: boolean; described: boolean}[] = [];
                const tokens = state.tokens.filter((token) => {
                    if (token.nesting < 0) return !parents.pop()?.unwrap;
                    if (token.nesting === 0) return true;
                    const parent = parents[parents.length - 1];
                    let unwrap = false;
                    if (token.type === headerContentOpen) {
                        unwrap = parent?.type !== headerOpen || parent.described;
                        if (!unwrap) parent.described = true;
                    }
                    parents.push({type: token.type, unwrap, described: false});
                    return !unwrap;
                });
                state.tokens.splice(0, state.tokens.length, ...tokens);
                return true;
            });
            return md;
        })
        .addMarkdownTokenParserSpec(headerContentTokenName, () => ({
            name: headerContentNodeName,
            type: 'block',
        }));
};
