import {setBlockType} from 'prosemirror-commands';
import {Fragment, NodeType} from 'prosemirror-model';
import {Command} from 'prosemirror-state';
import {hasParentNodeOfType} from 'prosemirror-utils';

import type {Action, ExtensionAuto, Keymap} from '../../../core';
import {textblockTypeInputRule} from '../../../utils/inputrules';
import {withLogAction} from '../../../utils/keymap';

import {CodeBlockSpecs, CodeBlockSpecsOptions} from './CodeBlockSpecs';
import {resetCodeblock} from './commands';
import {cbAction, cbType} from './const';
import {isFunction} from '../../../lodash';
import {CodeBlockHighlight, HighlightLangMap} from './CodeBlockHighlight/CodeBlockHighlight';
import {codeBlockPastePlugin} from './plugins/codeBlockPastePlugin';

export {resetCodeblock} from './commands';
export {
    codeBlockNodeName,
    CodeBlockNodeAttr,
    codeBlockLangAttr,
    codeBlockType,
} from './CodeBlockSpecs';

export type CodeBlockOptions = CodeBlockSpecsOptions & {
    codeBlockKey?: string | null;
    langs?: HighlightLangMap;
};

export const CodeBlock: ExtensionAuto<CodeBlockOptions> = (builder, opts) => {
    builder.use(CodeBlockSpecs, opts);

    builder.addKeymap((deps) => {
        const {codeBlockKey} = opts;
        const bindings: Keymap = {Backspace: resetCodeblock};
        if (codeBlockKey) {
            bindings[codeBlockKey] = withLogAction('code_block', setBlockType(cbType(deps.schema)));
        }
        return bindings;
    });

    builder.addInputRules(({schema}) => ({rules: [codeBlockRule(cbType(schema))]}));
    builder.addAction(cbAction, ({schema, serializer}) => {
        const cb = cbType(schema);
        const cmd: Command = (state, dispatch) => {
            if (!setBlockType(cb)(state)) return false;
            if (dispatch) {
                const markup = serializer.serialize(
                    Fragment.from(state.selection.content().content),
                );
                dispatch(
                    state.tr.replaceSelectionWith(
                        cb.createAndFill({}, markup ? state.schema.text(markup) : null)!,
                    ),
                );
            }
            return true;
        };

        return {
            isActive: (state) => hasParentNodeOfType(cb)(state.selection),
            isEnable: cmd,
            run: cmd,
        };
    });

    builder.addPlugin(
        codeBlockPastePlugin,
        builder.Priority.High,
    );

    if (isFunction(opts.langs)) {
        builder.use(opts.langs);
    } else {
        builder.use(CodeBlockHighlight, opts.langs ?? {});
    }
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
