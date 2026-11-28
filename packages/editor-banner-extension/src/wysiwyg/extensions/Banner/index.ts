import type {Action, ExtensionBuilder} from '@gravity-ui/markdown-editor/core';

import type {BannerUploadLimits} from '../../components/settings';
import {nodeUploadPlugin} from '../../plugins/NodeUploadPlugin';

import {WBannerNodeView} from './BannerNodeView';
import {BannerSpecs, bannerNodeName} from './BannerSpecs';
import {insertBanner} from './commands';
import {insertBannerAction} from './const';
import {
    bannerKeymap,
    bannerTitleTooltipPlugin,
    bannerTooltipPlugin,
} from './plugins/BannerTooltipPlugin';

import '@gravity-ui/markdown-plugin-banner/styles.css';

export type BannerOptions = BannerUploadLimits;

export const Banner = (builder: ExtensionBuilder, options: BannerOptions = {}) => {
    builder
        .use(BannerSpecs)
        .addNodeView(bannerNodeName, () => (node) => new WBannerNodeView(node))
        .addPlugin((deps) =>
            bannerTooltipPlugin(deps, {
                ...options,
                fileUploadHandler: builder.context.get('fileUploadHandler'),
            }),
        )
        .addPlugin(bannerTitleTooltipPlugin)
        .addPlugin(nodeUploadPlugin)
        .addAction(insertBannerAction, () => ({isEnable: insertBanner, run: insertBanner}))
        // Blocks inside the banner handle Tab first.
        .addKeymap(bannerKeymap, builder.Priority.Low);
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [insertBannerAction]: Action;
        }
    }
}
