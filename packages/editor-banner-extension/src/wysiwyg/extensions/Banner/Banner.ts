import type {FileUploadHandler} from '@gravity-ui/markdown-editor';
import type {Action, ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {type BannerUploadLimits, bannerUploadPlugin} from '../../plugins/BannerUploadPlugin';
import {BannerContent} from '../BannerContent';
import {BannerImage} from '../BannerImage';
import {BannerTitle} from '../BannerTitle';
import {inBannerPart} from '../commands';

import {WBannerNodeView} from './BannerNodeView';
import {BannerSpecs, bannerNodeName} from './BannerSpecs';
import {
    insertBanner,
    liftEmptyBlockFromBanner,
    stopAtBannerEnd,
    stopAtBannerStart,
} from './commands';
import {insertBannerAction} from './const';
import {bannerPastePlugin, bannerTitlePastePlugin} from './plugins/BannerPastePlugin';
import {bannerTooltip} from './plugins/BannerTooltipPlugin';
import {focusSelectionPlugin} from './plugins/FocusSelectionPlugin';

import '@gravity-ui/markdown-plugin-banner/banner/styles.css';

export type BannerOptions = BannerUploadLimits & {
    fileUploadHandler?: FileUploadHandler;
};

export const Banner: ExtensionAuto<BannerOptions> = (builder, options) => {
    const tooltip = bannerTooltip(options);
    builder
        .use(BannerSpecs)
        .use(BannerTitle)
        .use(BannerContent)
        .use(BannerImage, options)
        .addNodeView(bannerNodeName, () => (node) => new WBannerNodeView(node))
        .addPlugin(tooltip.plugin)
        .addPlugin(bannerUploadPlugin)
        .addPlugin(focusSelectionPlugin)
        .addPlugin(bannerPastePlugin, builder.Priority.High)
        .addPlugin(bannerTitlePastePlugin, builder.Priority.VeryHigh)
        .addAction(insertBannerAction, () => ({isEnable: insertBanner, run: insertBanner}))
        .addKeymap(
            () => ({
                Enter: liftEmptyBlockFromBanner,
                Backspace: stopAtBannerStart,
                Delete: stopAtBannerEnd,
            }),
            builder.Priority.High,
        )
        .addKeymap(
            () => ({
                Tab: inBannerPart(tooltip.focus()),
                'Shift-Tab': inBannerPart(tooltip.focus(true)),
            }),
            builder.Priority.VeryHigh,
        )
        .addKeymap(
            () => ({Tab: tooltip.focus(), 'Shift-Tab': tooltip.focus(true)}),
            builder.Priority.Low,
        );
};

declare global {
    namespace WysiwygEditor {
        interface Actions {
            [insertBannerAction]: Action;
        }
    }
}
