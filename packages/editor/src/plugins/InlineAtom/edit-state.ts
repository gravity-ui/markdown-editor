import type {NodeType, Schema} from 'prosemirror-model';
import {
    type EditorState,
    NodeSelection,
    Plugin,
    PluginKey,
    type Transaction,
} from 'prosemirror-state';

import {isNodeSelection} from '../../utils/selection';

/**
 * Position of the atom opened for explicit editing, as after a click or an insertion.
 * The popover of such an atom moves the focus into itself.
 * An atom selected by the keyboard opens the popover without moving the focus.
 */
type InlineAtomEdit = {pos: number; id: number} | null;

export type InlineAtomEditOptions = {
    /** Name of the plugin key. */
    name: string;
    /** Class of the atom DOM, used to catch clicks on it. */
    className: string;
    nodeType: (schema: Schema) => NodeType;
};

export type InlineAtomEditing = {
    plugin: () => Plugin<InlineAtomEdit>;
    /** Selects the atom at `pos` and opens it for editing. */
    start: (tr: Transaction, pos: number) => Transaction;
    isEdited: (state: EditorState) => boolean;
    /** Id of the latest request to edit the selected atom; every click or insertion gets a new one. */
    getEditId: (state: EditorState) => number | null;
};

let lastEditId = 0;

export function createInlineAtomEditing({
    name,
    className,
    nodeType,
}: InlineAtomEditOptions): InlineAtomEditing {
    const key = new PluginKey<InlineAtomEdit>(name);

    const start = (tr: Transaction, pos: number): Transaction =>
        tr.setSelection(NodeSelection.create(tr.doc, pos)).setMeta(key, {pos, id: ++lastEditId});

    const plugin = () =>
        new Plugin<InlineAtomEdit>({
            key,
            state: {
                init: () => null,
                apply(tr, edit) {
                    const meta: InlineAtomEdit | undefined = tr.getMeta(key);
                    if (meta !== undefined) return meta;
                    if (edit === null) return null;

                    const pos = tr.mapping.map(edit.pos);
                    if (!isNodeSelection(tr.selection) || tr.selection.from !== pos) return null;
                    return pos === edit.pos ? edit : {...edit, pos};
                },
            },
            props: {
                handleDOMEvents: {
                    // ProseMirror selects an atom before its click handlers run, so the click is caught here.
                    mousedown(view, event) {
                        const target = event.target instanceof Element ? event.target : null;
                        const dom = target?.closest(`.${className}`);
                        if (event.button !== 0 || !dom || !view.dom.contains(dom)) return false;

                        const pos = view.posAtDOM(dom, 0);
                        if (view.state.doc.nodeAt(pos)?.type !== nodeType(view.state.schema)) {
                            return false;
                        }

                        event.preventDefault();
                        view.dispatch(start(view.state.tr, pos));
                        return true;
                    },
                },
            },
        });

    return {
        plugin,
        start,
        isEdited: (state) => (key.getState(state) ?? null) !== null,
        getEditId: (state) => key.getState(state)?.id ?? null,
    };
}
