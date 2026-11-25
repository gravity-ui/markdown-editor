import {BaseTooltipPlugin} from '@gravity-ui/markdown-editor';
import type {ExtensionDeps} from '@gravity-ui/markdown-editor/core';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';

import {bannerNodeType} from '../../BannerSpecs';

import {
    BannerToolbar,
    type BannerToolbarOptions,
    bannerToolbarPopupClassName,
} from './BannerToolbar';

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
                popupClassName: bannerToolbarPopupClassName,
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
