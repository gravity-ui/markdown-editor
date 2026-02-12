import type {Action, ExtensionAuto, Keymap} from '#core';
import type {NodeType} from '#pm/model';
import {hasParentNodeOfType} from '#pm/utils';
import {isFunction} from 'src/lodash';
import {textblockTypeInputRule} from 'src/utils/inputrules';
import {withLogAction} from 'src/utils/keymap';

import {CodeBlockHighlight, type HighlightLangMap} from './CodeBlockHighlight/CodeBlockHighlight';
import {CodeBlockSpecs, type CodeBlockSpecsOptions} from './CodeBlockSpecs';
import {newlineInCode, resetCodeblock, setCodeBlockType} from './commands';
import {cbAction, codeBlockType, lineNumbersOptionsDefault} from './const';
import {codeBlockPastePlugin} from './plugins/codeBlockPastePlugin';

export {resetCodeblock} from './commands';
export {codeBlockNodeName, CodeBlockNodeAttr, codeBlockType} from './CodeBlockSpecs';

export type CodeBlockOptions = CodeBlockSpecsOptions & {
    codeBlockKey?: string | null;
    langs?: HighlightLangMap;
    /** Configure line wrapping toggle in code block */
    lineWrapping?: {
        /**
         * Enable line wrapping toggling in code block
         * @default false
         */
        enabled?: boolean;
    };
};

export const CodeBlock: ExtensionAuto<CodeBlockOptions> = (builder, opts) => {
    const optsNormalized: CodeBlockOptions = {
        ...opts,
        lineWrapping: {
            enabled: opts.lineWrapping?.enabled || false,
        },
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
            lineWrapping: optsNormalized.lineWrapping,
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
