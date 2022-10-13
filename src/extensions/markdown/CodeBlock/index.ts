import {setBlockType} from 'prosemirror-commands';
import {textblockTypeInputRule} from 'prosemirror-inputrules';
import {NodeType} from 'prosemirror-model';
import {hasParentNodeOfType} from 'prosemirror-utils';
import type {Action, ExtensionAuto, Keymap} from '../../../core';
import {resetCodeblock} from './commands';
import {cbAction, cbType, codeBlock, langAttr} from './const';

export type CodeBlockOptions = {
    codeBlockKey?: string | null;
};

export const CodeBlock: ExtensionAuto<CodeBlockOptions> = (builder, opts) => {
    builder.addNode(codeBlock, () => ({
        spec: {
            attrs: {[langAttr]: {default: 'text'}},
            content: 'text*',
            group: 'block',
            code: true,
            marks: '',
            selectable: true,
            allowSelection: true,
            parseDOM: [
                {
                    tag: 'pre',
                    preserveWhitespace: 'full',
                    getAttrs: (node) => ({
                        [langAttr]: (node as Element).getAttribute(langAttr) || '',
                    }),
                },
            ],
            toDOM({attrs}) {
                return ['pre', attrs[langAttr] ? attrs : {}, ['code', 0]];
            },
        },
        fromYfm: {
            tokenSpec: {
                name: codeBlock,
                type: 'block',
                noCloseToken: true,
            },
        },
        toYfm: (state, node) => {
            state.write('```' + (node.attrs[langAttr] || '') + '\n');
            state.text(node.textContent, false);
            state.ensureNewLine();
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
                name: codeBlock,
                type: 'block',
                noCloseToken: true,
                getAttrs: (tok) => ({[langAttr]: tok.info || ''}),
            },
        },
        toYfm: () => {
            throw new Error('Unexpected toYfm() call on fence node');
        },
    }));

    builder.addKeymap((deps) => {
        const {codeBlockKey} = opts;
        const bindings: Keymap = {Backspace: resetCodeblock};
        if (codeBlockKey) bindings[codeBlockKey] = setBlockType(cbType(deps.schema));
        return bindings;
    });

    builder.addInputRules(({schema}) => ({rules: [codeBlockRule(cbType(schema))]}));

    builder.addAction(cbAction, ({schema}) => {
        const cb = cbType(schema);
        const cmd = setBlockType(cb);
        return {
            isActive: (state) => hasParentNodeOfType(cb)(state.selection),
            isEnable: cmd,
            run: cmd,
        };
    });
};

declare global {
    namespace YfmEditor {
        interface Actions {
            [cbAction]: Action;
        }
    }
}

// Given a code block node type, returns an input rule that turns a
// textblock starting with three backticks into a code block.
function codeBlockRule(nodeType: NodeType) {
    return textblockTypeInputRule(/^```$/, nodeType);
}
