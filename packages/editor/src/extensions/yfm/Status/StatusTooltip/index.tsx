import {Plugin} from 'prosemirror-state';

import type {ExtensionDeps} from '#core';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';

import {statusType} from '../StatusSpecs';

import {StatusTooltip} from './StatusTooltip';

export const statusTooltipPlugin = (_deps: ExtensionDeps) =>
    new Plugin({
        view(view) {
            return new BaseTooltipPluginView(view, {
                idPrefix: 'status-tooltip',
                nodeType: statusType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (view, {node, pos}) => <StatusTooltip node={node} pos={pos} view={view} />,
            });
        },
    });
