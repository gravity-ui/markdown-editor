import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {nodeUploadPlugin} from '../../plugins/NodeUploadPlugin';

import {WBannerNodeView} from './BannerNodeView';
import {BannerSpecs, bannerNodeName} from './BannerSpecs';
import {insertBanner} from './commands';
import {insertBannerAction} from './const';
import {bannerKeymap, bannerTooltipPlugin} from './plugins/BannerTooltipPlugin';

import '@gravity-ui/markdown-plugin-banner/styles.css';

export const Banner: ExtensionAuto = (builder) => {
    builder
        .use(BannerSpecs)
        .addNodeView(bannerNodeName, () => (node) => new WBannerNodeView(node))
        .addPlugin(bannerTooltipPlugin)
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
