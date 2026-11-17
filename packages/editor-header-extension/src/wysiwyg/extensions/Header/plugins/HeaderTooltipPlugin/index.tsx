import {BaseTooltipPlugin} from '@gravity-ui/markdown-editor';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {headerNodeType} from '../../HeaderSpecs';

import {HeaderToolbar} from './HeaderToolbar';

export {headerKeymap} from './keymap';

export const headerTooltipPlugin = () =>
    new Plugin({
        view: (view) =>
            new BaseTooltipPlugin.BaseTooltipPluginView(view, {
                idPrefix: 'header-tooltip',
                nodeType: headerNodeType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (editorView, {node, pos, dom}) => (
                    <HeaderToolbar view={editorView} node={node} pos={pos} block={dom} />
                ),
            }),
    });
