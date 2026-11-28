import {BaseTooltipPlugin} from '@gravity-ui/markdown-editor';
import type {ExtensionDeps} from '@gravity-ui/markdown-editor/core';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import {bannerTitleTokenName} from '@gravity-ui/markdown-plugin-banner';

import {bannerNodeType} from '../../BannerSpecs';

import {BannerTitleToolbar} from './BannerTitleToolbar';
import {BannerToolbar, type BannerToolbarOptions} from './BannerToolbar';

export {bannerKeymap} from './keymap';

export const bannerTooltipPlugin = (
    {serializer, markupParser}: ExtensionDeps,
    options: BannerToolbarOptions = {},
) =>
    new Plugin({
        view: (view) =>
            new BaseTooltipPlugin.BaseTooltipPluginView(view, {
                idPrefix: 'banner-tooltip',
                nodeType: bannerNodeType(view.state.schema),
                popupPlacement: ['bottom', 'top'],
                content: (editorView, {node, pos, dom}) => {
                    const markup = () => {
                        const {doc} = editorView.state;
                        return serializer.serialize(doc.type.create(null, doc.nodeAt(pos) ?? node));
                    };

                    return (
                        <BannerToolbar
                            view={editorView}
                            node={node}
                            pos={pos}
                            block={dom}
                            markup={markup}
                            parser={markupParser}
                            {...options}
                        />
                    );
                },
            }),
    });

export const bannerTitleTooltipPlugin = () =>
    new Plugin({
        view: (view) =>
            new BaseTooltipPlugin.BaseTooltipPluginView(view, {
                idPrefix: 'banner-title-tooltip',
                nodeType: view.state.schema.nodes[bannerTitleTokenName],
                content: (editorView, {node, pos}) => (
                    <BannerTitleToolbar view={editorView} node={node} pos={pos} />
                ),
            }),
    });
