import type {ExtensionAuto, YENodeSpec} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

export const codeBlockNodeName = 'code_block';
export const codeBlockLangAttr = 'data-language';
export const codeBlockType = nodeTypeFactory(codeBlockNodeName);

export type CodeBlockSpecsOptions = {
    nodeview?: YENodeSpec['view'];
};

export const CodeBlockSpecs: ExtensionAuto<CodeBlockSpecsOptions> = (builder, opts) => {
    builder.addNode(codeBlockNodeName, () => ({
        view: opts.nodeview,
        spec: {
            attrs: {[codeBlockLangAttr]: {default: 'text'}},
            content: 'text*',
            group: 'block',
            code: true,
            marks: '',
            selectable: true,
            allowSelection: false,
            parseDOM: [
                {
                    tag: 'pre',
                    preserveWhitespace: 'full',
                    getAttrs: (node) => ({
                        [codeBlockLangAttr]:
                            (node as Element).getAttribute(codeBlockLangAttr) || '',
                    }),
                },
            ],
            toDOM({attrs}) {
                return ['pre', attrs[codeBlockLangAttr] ? attrs : {}, ['code', 0]];
            },
        },
        fromYfm: {
            tokenSpec: {
                name: codeBlockNodeName,
                type: 'block',
                noCloseToken: true,
                prepareContent: removeNewLineAtEnd, // content of code blocks contains extra \n at the end
            },
        },
        toYfm: (state, node) => {
            state.write('```' + (node.attrs[codeBlockLangAttr] || '') + '\n');
            state.text(node.textContent, false);
            // Add a newline to the current content before adding closing marker
            state.write('\n');
            state.write('```');
            state.closeBlock(node);
        },
    }));
    builder.addNode('fence', () => ({
        //  we adding this node only for define specific 'fence' parser token,
        //  which parse fence md token to code_block node
        spec: {},
        fromYfm: {
            tokenSpec: {
                name: codeBlockNodeName,
                type: 'block',
                noCloseToken: true,
                getAttrs: (tok) => ({[codeBlockLangAttr]: tok.info || ''}),
                prepareContent: removeNewLineAtEnd, // content of fence blocks contains extra \n at the end
            },
        },
        toYfm: () => {
            throw new Error('Unexpected toYfm() call on fence node');
        },
    }));
};

function removeNewLineAtEnd(content: string): string {
    return content.endsWith('\n') ? content.slice(0, content.length - 1) : content;
}
