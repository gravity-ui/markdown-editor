import {isolateHistory} from '@codemirror/commands';
import {ensureSyntaxTree} from '@codemirror/language';
import type {StateCommand} from '@codemirror/state';

import {StructuralInlineFormattingFacet} from '../../codemirror/structural-inline-formatting-facet';

import {collectSimpleWord} from './literal';
import {createFormattingTransaction, planFormatting} from './plan';
import {collectFormattingParts} from './ranges';
import type {InlineCommandSpec, SyntaxTree} from './types';

const syntaxTreeTimeout = 50;

type CommandTarget = Parameters<StateCommand>[0];

type InlineCommandOptions = {
    spec: InlineCommandSpec;
    fallback: StateCommand;
};

/**
 * Creates a style toggle, code toggle, or wrap command from a marker spec and fallback.
 * Use it in command factories. The old command runs when the feature is disabled
 * or the full syntax tree is missing, before any edits. Empty parts do not run fallback.
 */
export function createInlineCommand({spec, fallback}: InlineCommandOptions): StateCommand {
    return (target) => {
        const {state, dispatch} = target;
        if (!state.facet(StructuralInlineFormattingFacet)) return fallback(target);
        // Explicit word edits use local markers, even inside code or link fields.
        let parts = collectSimpleWord(state, spec);
        let tree: SyntaxTree | null = null;
        if (!parts) {
            tree = ensureSyntaxTree(state, state.doc.length, syntaxTreeTimeout);
            // Do not mix partial tree results with the old algorithm.
            if (!tree) return runFallbackCommand(fallback, target);
            parts = collectFormattingParts(state, tree, spec);
        }
        const plan = planFormatting(state, parts, spec, tree);
        if (plan) dispatch(state.update(createFormattingTransaction(state, plan)));
        return true;
    };
}

/**
 * Runs the fallback command as a separate undo step.
 * Used only when the complete syntax tree is not available within the time budget.
 */
function runFallbackCommand(command: StateCommand, {state, dispatch}: CommandTarget): boolean {
    return command({
        state,
        dispatch: (tr) =>
            dispatch(
                state.update({
                    changes: tr.changes,
                    selection: tr.selection,
                    effects: tr.effects,
                    scrollIntoView: tr.scrollIntoView,
                    annotations: isolateHistory.of('full'),
                }),
            ),
    });
}
