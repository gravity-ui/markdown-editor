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
import {bannerTitleTooltip} from './plugins/BannerTitleTooltipPlugin';

import '@gravity-ui/markdown-plugin-banner/banner-title/styles.css';

export const BannerTitle: ExtensionAuto = (builder) => {
    const tooltip = bannerTitleTooltip();
    builder
        .addPlugin(tooltip.plugin)
        .addPlugin(() => selectionInsidePlugin(bannerTitleNodeType))
        .addPlugin(bannerTitleGuardPlugin, builder.Priority.High)
        .addKeymap(
            () => ({
                Enter: leaveBannerTitle,
                Backspace: chainCommands(deleteBannerTitleText, stopAtBannerTitleStart),
                Delete: chainCommands(deleteBannerTitleText, stopAtBannerTitleEnd),
            }),
            builder.Priority.High,
        )
        .addKeymap(() => ({Tab: tooltip.focus()}), builder.Priority.VeryHigh);
};
