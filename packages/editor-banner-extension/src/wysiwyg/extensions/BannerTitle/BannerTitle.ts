import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import {selectionInsidePlugin} from '../../plugins/SelectionInsidePlugin';

import {bannerTitleNodeType} from './BannerTitleSpecs';
import {
    deleteBannerTitleText,
    leaveBannerTitle,
    stopAtBannerTitleEnd,
    stopAtBannerTitleStart,
} from './commands';
import {bannerTitleGuardPlugin} from './plugins/BannerTitleGuardPlugin';
import {bannerTitlePastePlugin, bannerTitleTextPastePlugin} from './plugins/BannerTitlePastePlugin';
import {bannerTitleTooltip} from './plugins/BannerTitleTooltipPlugin';

/** The editing of the banner title; `Banner` uses it, and `BannerSpecs` holds its schema. */
export const BannerTitle: ExtensionAuto = (builder) => {
    const tooltip = bannerTitleTooltip();
    builder
        .addPlugin(tooltip.plugin)
        .addPlugin(() => selectionInsidePlugin(bannerTitleNodeType))
        .addPlugin(bannerTitleGuardPlugin, builder.Priority.High)
        .addPlugin(bannerTitlePastePlugin, builder.Priority.High)
        .addPlugin(bannerTitleTextPastePlugin, builder.Priority.VeryHigh)
        .addKeymap(
            () => ({
                Enter: leaveBannerTitle,
                Backspace: chainCommands(deleteBannerTitleText, stopAtBannerTitleStart),
                Delete: chainCommands(deleteBannerTitleText, stopAtBannerTitleEnd),
            }),
            builder.Priority.High,
        )
        // With the cursor in the title, Tab focuses the title toolbar before the banner toolbar.
        .addKeymap(() => ({Tab: tooltip.focus}), builder.Priority.VeryHigh);
};
