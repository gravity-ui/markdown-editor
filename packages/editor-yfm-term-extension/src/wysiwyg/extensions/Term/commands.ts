import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    NodeSelection,
    PluginKey,
    TextSelection,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {termDefinitionNodeName, termNodeName} from './TermSpecs';

export type TermTarget = {id: number; from: number; to: number; edit: boolean};
export const termEditorKey = new PluginKey<TermTarget | null>('yfm-term-editor');

let nextTargetId = 0;

export function canInsertTerm({selection, schema}: EditorState) {
    return (
        selection instanceof TextSelection &&
        selection.$from.sameParent(selection.$to) &&
        selection.$from.parent.inlineContent &&
        !selection.$from.parent.type.spec.code &&
        selection.$from.parent.canReplaceWith(
            selection.$from.index(),
            selection.$to.indexAfter(),
            schema.nodes[termNodeName],
        )
    );
}

export const openTermEditor: Command = (state, dispatch) => {
    if (!canInsertTerm(state)) return false;
    const {from, to} = state.selection;
    if (dispatch) {
        dispatch(state.tr.setMeta(termEditorKey, {id: nextTargetId++, from, to, edit: false}));
    }
    return true;
};

export function editTerm(view: EditorView, from: number) {
    const {state} = view;
    const node = state.doc.nodeAt(from);
    if (node?.type.name !== termNodeName) return;
    view.dispatch(
        state.tr.setSelection(NodeSelection.create(state.doc, from)).setMeta(termEditorKey, {
            id: nextTargetId++,
            from,
            to: from + node.nodeSize,
            edit: true,
        }),
    );
}

export function closeTermEditor(view: EditorView, focus: boolean) {
    view.dispatch(view.state.tr.setMeta(termEditorKey, null));
    if (focus) view.focus();
}

function findDefinition(doc: Node, key: string) {
    let match: {node: Node; pos: number} | undefined;
    doc.forEach((node, pos) => {
        if (!match && node.type.name === termDefinitionNodeName && node.attrs.key === key) {
            match = {node, pos};
        }
    });
    return match;
}

export function getTermDefinition(doc: Node, key: string): string {
    return findDefinition(doc, key)?.node.attrs.definition ?? '';
}

export function saveTerm(
    view: EditorView,
    targetId: number,
    key: string,
    label: string,
    definition: string,
) {
    const {state} = view;
    const target = termEditorKey.getState(state);
    if (target?.id !== targetId) return;
    const reference = state.schema.nodes[termNodeName].create({key, label});
    const storedDefinition = findDefinition(state.doc, key);
    const tr = state.tr.replaceWith(target.from, target.to, reference);

    if (storedDefinition) {
        if (storedDefinition.node.attrs.definition !== definition) {
            tr.setNodeMarkup(tr.mapping.map(storedDefinition.pos), undefined, {key, definition});
        }
    } else {
        tr.insert(
            tr.doc.content.size,
            state.schema.nodes[termDefinitionNodeName].create({key, definition}),
        );
    }

    tr.setSelection(TextSelection.create(tr.doc, target.from + reference.nodeSize));
    view.dispatch(tr.setMeta(termEditorKey, null));
    view.focus();
}

export const preventDeletingTermDefinition: Command = ({doc, selection}) => {
    if (!(selection instanceof TextSelection) || !selection.$cursor) return false;
    const {$cursor} = selection;
    if ($cursor.parentOffset !== $cursor.parent.content.size) return false;

    // A forward delete at the end of the document should leave hidden definitions intact.
    for (let depth = $cursor.depth; depth > 0; depth--) {
        const next = doc.nodeAt($cursor.after(depth));
        if (next) return next.type.name === termDefinitionNodeName;
    }
    return false;
};
