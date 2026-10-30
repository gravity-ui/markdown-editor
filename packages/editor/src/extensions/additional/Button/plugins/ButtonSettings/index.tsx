import {Plugin} from '#pm/state';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';

import {buttonNodeName} from '../../ButtonSpecs';

import {ButtonSettings} from './ButtonSettings';

/** Настройки открываются под кнопкой, когда она выделена. */
export const buttonSettingsPlugin = () =>
    new Plugin({
        view(view) {
            return new BaseTooltipPluginView(view, {
                idPrefix: 'button-settings',
                nodeType: view.state.schema.nodes[buttonNodeName],
                popupPlacement: ['bottom-start', 'top-start'],
                content: (editorView, {node, pos}) => (
                    <ButtonSettings node={node} pos={pos} editorView={editorView} />
                ),
            });
        },
    });
