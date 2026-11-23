import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {TermNodeView} from './TermNodeView/NodeView';
import {TermSpecs, termNodeName} from './TermSpecs';
import {canInsertTerm, openTermEditor, preventDeletingTermDefinition} from './commands';
import {termEditorPlugin} from './editorPlugin';

export const Term: ExtensionAuto = (builder) => {
    builder
        .use(TermSpecs)
        .addNodeView(
            termNodeName,
            () => (node, view, getPos) => new TermNodeView(node, view, getPos),
        )
        .addPlugin(termEditorPlugin)
        .addKeymap(() => ({Delete: preventDeletingTermDefinition}), builder.Priority.High)
        .addAction('insertTerm', () => ({isEnable: canInsertTerm, run: openTermEditor}));
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            insertTerm: Action;
        }
    }
}
