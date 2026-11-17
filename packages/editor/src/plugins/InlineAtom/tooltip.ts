import {type EditorState, TextSelection} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import {type BaseTooltipPluginOptions, BaseTooltipPluginView} from '../BaseTooltip';

export type InlineAtomTooltipOptions = BaseTooltipPluginOptions & {
    getEditId: (state: EditorState) => number | null;
};

/** The popover of an inline atom, opened again by every new request to edit the atom. */
export class InlineAtomTooltipView extends BaseTooltipPluginView {
    private readonly getEditId: InlineAtomTooltipOptions['getEditId'];
    private editId: number | null = null;

    constructor(view: EditorView, {getEditId, ...options}: InlineAtomTooltipOptions) {
        super(view, options);
        this.getEditId = getEditId;
    }

    update(view: EditorView) {
        const editId = this.getEditId(view.state);
        const editChanged = editId !== this.editId;
        this.editId = editId;

        super.update(view);
        if (editChanged) {
            // A click or an insertion opens the popover again after Escape or an outside click.
            if (editId !== null) this.manualHidden = false;
            this.render();
        }
    }
    protected startTrackingViewFocus() {
        this.stopTrackingViewFocus();
    }

    protected hidePopupManual() {
        const current = this.currentNode;
        super.hidePopupManual();
        if (current) {
            const {state} = this.view;
            const node = state.doc.nodeAt(current.pos);
            if (node?.type === this.nodeType) {
                this.view.dispatch(
                    state.tr.setSelection(
                        TextSelection.near(state.doc.resolve(current.pos + node.nodeSize)),
                    ),
                );
            }
        }
    }
}
