import {BaseTooltipPlugin} from '@gravity-ui/markdown-editor';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {buttonNodeType} from '../../ButtonSpecs';

import {ButtonToolbar} from './ButtonToolbar';

export const buttonTooltipPlugin = () =>
    new Plugin({
        view: (view) =>
            new BaseTooltipPlugin.BaseTooltipPluginView(view, {
                idPrefix: 'button-tooltip',
                nodeType: buttonNodeType(view.state.schema),
                popupPlacement: ['bottom-start', 'top-start'],
                content: (editorView, {node, pos}) => (
                    <ButtonToolbar view={editorView} node={node} pos={pos} />
                ),
            }),
    });
