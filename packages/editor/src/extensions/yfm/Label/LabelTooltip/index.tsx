import {Plugin} from 'prosemirror-state';

import {InlineAtomTooltipView} from 'src/plugins/InlineAtom';

import {labelType} from '../LabelSpecs';
import {removeEmptyLabel} from '../commands';
import {getLabelEditId, isLabelEdited} from '../edit-state';

import {LabelTooltip} from './LabelTooltip';

class LabelTooltipView extends InlineAtomTooltipView {
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
                getEditId: getLabelEditId,
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
