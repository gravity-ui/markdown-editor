import type {NodeType} from 'prosemirror-model';
// @ts-ignore // TODO: fix cjs build
import {hasParentNodeOfType} from 'prosemirror-utils';

import type {Action, ExtensionAuto, Keymap} from '../../../core';
import {isFunction} from '../../../lodash';
import {textblockTypeInputRule} from '../../../utils/inputrules';
import {withLogAction} from '../../../utils/keymap';

import {CodeBlockHighlight, HighlightLangMap} from './CodeBlockHighlight/CodeBlockHighlight';
import {CodeBlockSpecs, CodeBlockSpecsOptions} from './CodeBlockSpecs';
import {newlineInCode, resetCodeblock, setCodeBlockType} from './commands';
import {cbAction, codeBlockType} from './const';
import {codeBlockPastePlugin} from './plugins/codeBlockPastePlugin';

export {resetCodeblock} from './commands';
export {codeBlockNodeName, CodeBlockNodeAttr, codeBlockType} from './CodeBlockSpecs';

export type CodeBlockOptions = CodeBlockSpecsOptions & {
    codeBlockKey?: string | null;
    langs?: HighlightLangMap;
};

export const CodeBlock: ExtensionAuto<CodeBlockOptions> = (builder, opts) => {
    builder.use(CodeBlockSpecs, opts);

    builder.addKeymap((deps) => {
        const {codeBlockKey} = opts;
        const bindings: Keymap = {Enter: newlineInCode, Backspace: resetCodeblock};
        if (codeBlockKey) {
            bindings[codeBlockKey] = withLogAction('code_block', setCodeBlockType(deps));
        }
        return bindings;
    });

    builder.addInputRules(({schema}) => ({rules: [codeBlockRule(codeBlockType(schema))]}));
    builder.addAction(cbAction, (deps) => {
        const cb = codeBlockType(deps.schema);
        return {
            isActive: (state) => hasParentNodeOfType(cb)(state.selection),
            isEnable: setCodeBlockType(deps),
            run: setCodeBlockType(deps),
        };
    });

    builder.addPlugin(codeBlockPastePlugin, builder.Priority.High);

    if (isFunction(opts.langs)) {
        builder.use(opts.langs);
    } else {
        builder.use(CodeBlockHighlight, opts.langs ?? {});
    }
};

declare global {
    namespace WysiwygEditor {
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
