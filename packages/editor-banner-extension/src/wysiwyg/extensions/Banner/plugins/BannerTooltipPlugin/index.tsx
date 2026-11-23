import {BaseTooltipPlugin} from '@gravity-ui/markdown-editor';
import type {ExtensionDeps} from '@gravity-ui/markdown-editor/core';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {bannerNodeType} from '../../BannerSpecs';

import {BannerToolbar} from './BannerToolbar';

export {bannerKeymap} from './keymap';

export const bannerTooltipPlugin = ({serializer}: ExtensionDeps) =>
    new Plugin({
        view: (view) =>
            new BaseTooltipPlugin.BaseTooltipPluginView(view, {
                idPrefix: 'banner-tooltip',
                nodeType: bannerNodeType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (editorView, {node, pos, dom}) => (
                    <BannerToolbar
                        view={editorView}
                        node={node}
                        pos={pos}
                        block={dom}
                        serializer={serializer}
                    />
                ),
            }),
    });
