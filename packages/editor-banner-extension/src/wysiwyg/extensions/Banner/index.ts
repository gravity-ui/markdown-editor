import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {WBannerNodeView} from './BannerNodeView';
import {BannerSpecs, bannerNodeName} from './BannerSpecs';
import {insertBanner} from './commands';
import {insertBannerAction} from './const';
import {bannerKeymap, bannerTooltipPlugin} from './plugins/BannerTooltipPlugin';
import {type BannerImageLimits, bannerUploadPlugin} from './plugins/BannerUploadPlugin';

import '@gravity-ui/markdown-plugin-banner/styles.css';

export type BannerOptions = BannerImageLimits & {
    /** Uploads background images; without it, the background image is set by a link only. */
    fileUploadHandler?: FileUploadHandler;
};

export const Banner: ExtensionAuto<BannerOptions> = (builder, options) => {
    builder
        .use(BannerSpecs)
        .addNodeView(bannerNodeName, () => (node) => new WBannerNodeView(node))
        .addPlugin((deps) => bannerTooltipPlugin(deps, options))
        .addPlugin(bannerUploadPlugin)
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
