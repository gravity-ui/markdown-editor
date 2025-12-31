import type {NodeType} from 'prosemirror-model';
// @ts-ignore // TODO: fix cjs build
import {hasParentNodeOfType} from 'prosemirror-utils';

import type {Action, ExtensionAuto, Keymap} from '../../../core';
import {isFunction} from '../../../lodash';
import {textblockTypeInputRule} from '../../../utils/inputrules';
import {withLogAction} from '../../../utils/keymap';

import {CodeBlockHighlight, type HighlightLangMap} from './CodeBlockHighlight/CodeBlockHighlight';
import {
    CodeBlockSpecs,
    type CodeBlockSpecsOptions,
    type LineNumbersOptions,
} from './CodeBlockSpecs';
import {newlineInCode, resetCodeblock, setCodeBlockType} from './commands';
import {cbAction, codeBlockType} from './const';
import {codeBlockPastePlugin} from './plugins/codeBlockPastePlugin';

export {resetCodeblock} from './commands';
export {codeBlockNodeName, CodeBlockNodeAttr, codeBlockType} from './CodeBlockSpecs';

export type CodeBlockOptions = CodeBlockSpecsOptions & {
    codeBlockKey?: string | null;
    langs?: HighlightLangMap;
};

export const lineNumbersOptionsDefault: LineNumbersOptions = {enabled: true, showByDefault: true};

export const CodeBlock: ExtensionAuto<CodeBlockOptions> = (builder, opts) => {
    const optsNormalized: CodeBlockOptions = {
        ...opts,
        lineNumbers: {
            enabled:
                typeof opts.lineNumbers?.enabled === 'boolean'
                    ? opts.lineNumbers.enabled
                    : lineNumbersOptionsDefault.enabled,
            showByDefault:
                typeof opts.lineNumbers?.showByDefault === 'boolean'
                    ? opts.lineNumbers.showByDefault
                    : lineNumbersOptionsDefault.showByDefault,
        },
    };

    builder.use(CodeBlockSpecs, optsNormalized);

    builder.addKeymap((deps) => {
        const {codeBlockKey} = optsNormalized;
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

    if (isFunction(optsNormalized.langs)) {
        builder.use(optsNormalized.langs);
    } else {
        builder.use(CodeBlockHighlight, {
            langs: optsNormalized.langs,
            lineNumbers: optsNormalized.lineNumbers,
        });
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
