import {Plugin} from '#pm/state';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';

import {buttonNodeName} from '../../ButtonSpecs';

import {ButtonToolbar} from './ButtonToolbar';

export const buttonToolbarPlugin = () =>
    new Plugin({
        view(view) {
            return new BaseTooltipPluginView(view, {
                idPrefix: 'button-toolbar',
                nodeType: view.state.schema.nodes[buttonNodeName],
                popupPlacement: ['bottom', 'top'],
                content: (view, {node, pos}) => (
                    <ButtonToolbar node={node} pos={pos} editorView={view} />
                ),
            });
        },
    });
