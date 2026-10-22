import {Plugin} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import {InlineAtomTooltipView} from 'src/plugins/InlineAtom';

import {labelType} from '../LabelSpecs';
import {removeEmptyLabel} from '../commands';
import {getLabelEditId} from '../edit-state';
import {getExistingLabels, getSuggestedLabels} from '../existing-labels-plugin';

import {LabelTooltip} from './LabelTooltip';

class LabelTooltipView extends InlineAtomTooltipView {
    private labels: ReturnType<typeof getExistingLabels> | null = null;

    update(view: EditorView) {
        const labels = getExistingLabels(view.state);
        const changed = labels !== this.labels;
        this.labels = labels;
        super.update(view);
        // Other labels can change while this label and its selection stay unchanged.
        if (changed && this.currentNode) this.render();
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
                popupPlacement: ['bottom-start', 'top-start', 'bottom-end', 'top-end'],
                popupClassName: 'g-md-label-popup',
                getEditId: getLabelEditId,
                content: (tooltipView, {node, pos}) => (
                    <LabelTooltip
                        node={node}
                        pos={pos}
                        view={tooltipView}
                        editId={getLabelEditId(tooltipView.state)}
                        suggestions={getSuggestedLabels(tooltipView.state, pos)}
                    />
                ),
            });
        },
    });
