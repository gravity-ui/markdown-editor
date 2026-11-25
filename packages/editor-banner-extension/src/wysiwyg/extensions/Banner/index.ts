import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import type {Action, ExtensionBuilder} from '@gravity-ui/markdown-editor/core';

import {type BannerUploadLimits, bannerUploadPlugin} from '../../plugins/BannerUploadPlugin';
import {BannerContent} from '../BannerContent';
import {BannerImage} from '../BannerImage';
import {BannerTitle} from '../BannerTitle';

import {WBannerNodeView} from './BannerNodeView';
import {BannerSpecs, bannerNodeName} from './BannerSpecs';
import {insertBanner, stopAtBannerEnd, stopAtBannerStart} from './commands';
import {insertBannerAction} from './const';
import {bannerKeymap, bannerTooltipPlugin} from './plugins/BannerTooltipPlugin';

import '@gravity-ui/markdown-plugin-banner/styles.css';

export type BannerOptions = BannerUploadLimits & {
    /** Uploads background images; without it, the background image is set by a link only. */
    fileUploadHandler?: FileUploadHandler;
};

export const Banner = (builder: ExtensionBuilder, options: BannerOptions = {}) => {
    builder
        .use(BannerSpecs)
        .use(BannerTitle)
        .use(BannerContent)
        .use(BannerImage)
        .addNodeView(bannerNodeName, () => (node) => new WBannerNodeView(node))
        .addPlugin((deps) => bannerTooltipPlugin(deps, options))
        .addPlugin(bannerUploadPlugin)
        .addAction(insertBannerAction, () => ({isEnable: insertBanner, run: insertBanner}))
        .addKeymap(
            () => ({Backspace: stopAtBannerStart, Delete: stopAtBannerEnd}),
            builder.Priority.High,
        )
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
