import {history} from '@codemirror/commands';
import {EditorSelection, EditorState, type StateCommand} from '@codemirror/state';

import {LinkifyFacet} from '../../../codemirror/linkify-facet';
import {StructuralInlineFormattingFacet} from '../../../codemirror/structural-inline-formatting-facet';
import {yfmLang} from '../../../codemirror/yfm';

type EditorOptions = {
    selection?: EditorSelection;
    lineSeparator?: string;
    linkify?: boolean;
    structuralInlineFormatting?: boolean;
};

export function createEditor(doc: string, options: EditorOptions = {}) {
    let state = EditorState.create({
        doc,
        extensions: [
            yfmLang(),
            history(),
            EditorState.allowMultipleSelections.of(true),
            LinkifyFacet.of(options.linkify ?? false),
            StructuralInlineFormattingFacet.of(options.structuralInlineFormatting ?? true),
            options.lineSeparator ? EditorState.lineSeparator.of(options.lineSeparator) : [],
        ],
    });
    state = state.update({
        selection: options.selection ?? EditorSelection.single(0, state.doc.length),
    }).state;

    return {
        get state() {
            return state;
        },
        get text() {
            return state.doc.toString();
        },
        run(command: StateCommand) {
            return command({
                state,
                dispatch: (transaction) => {
                    state = transaction.state;
                },
            });
        },
    };
}
