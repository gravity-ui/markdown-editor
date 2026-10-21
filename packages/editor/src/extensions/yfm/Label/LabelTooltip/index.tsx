import {Plugin} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';

import {labelType} from '../LabelSpecs';
import {removeEmptyLabel} from '../commands';
import {getLabelEditId, isLabelEdited} from '../edit-state';

import {LabelTooltip} from './LabelTooltip';

class LabelTooltipView extends BaseTooltipPluginView {
    private editId: number | null = null;

    update(view: EditorView) {
        const editId = getLabelEditId(view.state);
        const editChanged = editId !== this.editId;
        this.editId = editId;

        super.update(view);
        if (editChanged) {
            // A click or an insertion opens the popover again after Escape or an outside click.
            if (editId !== null) this.manualHidden = false;
            this.render();
        }
    }

    // Escape and an outside click keep the selection on the label, so an empty label is removed here.
    protected hidePopupManual() {
        const pos = this.currentNode?.pos;
        if (pos !== undefined && removeEmptyLabel(pos)(this.view.state, this.view.dispatch)) return;

        super.hidePopupManual();
    }
}

export const labelTooltipPlugin = () =>
    new Plugin({
        view(view) {
            return new LabelTooltipView(view, {
                idPrefix: 'label-tooltip',
                nodeType: labelType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (tooltipView, {node, pos}) => (
                    <LabelTooltip
                        node={node}
                        pos={pos}
                        view={tooltipView}
                        edited={isLabelEdited(tooltipView.state)}
                    />
                ),
            });
        },
    });
