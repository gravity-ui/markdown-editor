import {Plugin} from 'prosemirror-state';

import {InlineAtomTooltipView} from 'src/plugins/InlineAtom';

import {dateType} from '../YfmDateSpecs';
import {getDateEditId, isDateEdited} from '../edit-state';

import {DateTooltip} from './DateTooltip';

export const dateTooltipPlugin = () =>
    new Plugin({
        view(view) {
            return new InlineAtomTooltipView(view, {
                idPrefix: 'date-tooltip',
                nodeType: dateType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                getEditId: getDateEditId,
                content: (tooltipView, {node, pos}) => (
                    <DateTooltip
                        node={node}
                        pos={pos}
                        view={tooltipView}
                        edited={isDateEdited(tooltipView.state)}
                    />
                ),
            });
        },
    });
