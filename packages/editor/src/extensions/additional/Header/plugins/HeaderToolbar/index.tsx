import {Plugin} from '#pm/state';
import {BaseTooltipPluginView} from 'src/plugins/BaseTooltip';

import {headerNodeName} from '../../HeaderSpecs';

import {HeaderToolbar} from './HeaderToolbar';

export const headerToolbarPlugin = () =>
    new Plugin({
        view(view) {
            return new BaseTooltipPluginView(view, {
                idPrefix: 'header-toolbar',
                nodeType: view.state.schema.nodes[headerNodeName],
                popupPlacement: ['bottom', 'top'],
                content: (editorView, {node, pos}) => (
                    <HeaderToolbar node={node} pos={pos} editorView={editorView} />
                ),
            });
        },
    });
