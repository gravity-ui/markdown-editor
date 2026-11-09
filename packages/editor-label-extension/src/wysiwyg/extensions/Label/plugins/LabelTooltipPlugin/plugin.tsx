import {InlineAtomPlugin} from '@gravity-ui/markdown-editor';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {labelNodeType} from '../../LabelSpecs';
import {removeEmptyLabel} from '../../commands';
import {getExistingLabels, getSuggestedLabels} from '../ExistingLabelsPlugin';
import {getLabelEditId} from '../LabelEditPlugin';

import {LabelTooltip} from './components/LabelTooltip';

class LabelTooltipView extends InlineAtomPlugin.InlineAtomTooltipView {
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
                nodeType: labelNodeType(view.state.schema),
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
