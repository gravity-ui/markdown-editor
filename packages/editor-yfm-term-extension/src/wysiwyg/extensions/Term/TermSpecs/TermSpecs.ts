import {log} from '@diplodoc/transform/lib/log.js';
import term from '@diplodoc/transform/lib/plugins/term/index.js';
import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {termDefinitionNodeName, termNodeName} from './const';

export const TermSpecs: ExtensionAuto = (builder) => {
    builder
        .configureMd((md) => {
            md.use(term, {log});
            md.core.ruler.after('termReplace', 'editor_yfm_term', (state) => {
                const terms: Record<string, string> | undefined = state.env.terms;
                if (!terms) return;

                // Keep Diplodoc's definition source instead of its HTML dialog tokens.
                let definitionDepth = 0;
                // eslint-disable-next-line no-param-reassign -- Markdown-it core rules update the token stream.
                state.tokens = state.tokens.filter((token) => {
                    if (token.type === 'dfn_open') {
                        definitionDepth++;
                        return false;
                    }
                    if (token.type === 'dfn_close') {
                        definitionDepth--;
                        return false;
                    }

                    if (definitionDepth) return false;
                    if (token.children) {
                        // eslint-disable-next-line no-param-reassign -- The existing inline token keeps its block metadata.
                        token.children = token.children.flatMap((child, index, children) => {
                            if (child.type === 'term_open') {
                                const reference = new state.Token(termNodeName, '', 0);
                                reference.attrSet('key', child.attrGet('term-key')?.slice(1) ?? '');
                                reference.content = children[index + 1].content;
                                return [reference];
                            }
                            if (
                                child.type === 'term_close' ||
                                children[index - 1]?.type === 'term_open'
                            ) {
                                return [];
                            }
                            return [child];
                        });
                    }
                    return true;
                });

                if (!state.tokens.length && Object.keys(terms).length) {
                    state.tokens.push(
                        new state.Token('paragraph_open', 'p', 1),
                        new state.Token('paragraph_close', 'p', -1),
                    );
                }

                for (const [key, definition] of Object.entries(terms)) {
                    const token = new state.Token(termDefinitionNodeName, '', 0);
                    token.block = true;
                    token.attrSet('key', key.slice(1));
                    token.content = definition;
                    state.tokens.push(token);
                }
            });
            return md;
        })
        .addNodeSpec(termNodeName, () => ({
            group: 'inline',
            inline: true,
            atom: true,
            attrs: {key: {}, label: {}},
            leafText: (node) => node.attrs.label,
            toDOM: (node) => ['span', node.attrs.label],
        }))
        .addNodeSpec(termDefinitionNodeName, () => ({
            group: 'block',
            atom: true,
            selectable: false,
            attrs: {key: {}, definition: {}},
            toDOM: () => ['div', {hidden: 'hidden'}],
        }))
        .addMarkdownTokenParserSpec(termNodeName, () => ({
            name: termNodeName,
            type: 'node',
            getAttrs: (token) => ({key: token.attrGet('key'), label: token.content}),
        }))
        .addMarkdownTokenParserSpec(termDefinitionNodeName, () => ({
            name: termDefinitionNodeName,
            type: 'node',
            getAttrs: (token) => ({key: token.attrGet('key'), definition: token.content}),
        }))
        .addNodeSerializerSpec(termNodeName, () => (state, {attrs}) => {
            const label = attrs.label.replace(/[\\[\]]/g, '\\$&');
            state.text('[' + label + '](*' + attrs.key + ')', false);
        })
        .addNodeSerializerSpec(termDefinitionNodeName, () => (state, node) => {
            state.write('[*' + node.attrs.key + ']: ' + node.attrs.definition);
            state.closeBlock(node);
        });
};
