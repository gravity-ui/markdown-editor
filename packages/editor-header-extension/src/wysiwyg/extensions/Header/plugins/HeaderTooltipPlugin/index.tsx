import {BaseTooltipPlugin} from '@gravity-ui/markdown-editor';
import type {ExtensionDeps} from '@gravity-ui/markdown-editor/core';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {headerNodeType} from '../../HeaderSpecs';
import type {HeaderOptions} from '../../index';
import {headerMarkup} from '../../utils';

import {HeaderToolbar} from './HeaderToolbar';

export {headerKeymap} from './keymap';

export const headerTooltipPlugin = ({serializer}: ExtensionDeps, options: HeaderOptions = {}) =>
    new Plugin({
        view: (view) =>
            new BaseTooltipPlugin.BaseTooltipPluginView(view, {
                idPrefix: 'header-tooltip',
                nodeType: headerNodeType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (editorView, {node, pos, dom}) => (
                    <HeaderToolbar
                        view={editorView}
                        node={node}
                        pos={pos}
                        block={dom}
                        markup={() => headerMarkup(serializer, editorView.state, pos) ?? ''}
                        {...options}
                    />
                ),
            }),
    });
