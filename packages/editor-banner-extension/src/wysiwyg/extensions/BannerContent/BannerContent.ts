import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import {selectionInsidePlugin} from '../../plugins/SelectionInsidePlugin';

import {bannerContentNodeType} from './BannerContentSpecs';
import {
    clearBannerContent,
    keepEmptyBannerContentText,
    stopAtBannerContentEnd,
    stopAtBannerContentStart,
} from './commands';
import {bannerContentUnwrapPlugin} from './plugins/BannerContentUnwrapPlugin';

export const BannerContent: ExtensionAuto = (builder) => {
    builder
        .addPlugin(() => selectionInsidePlugin(bannerContentNodeType))
        .addPlugin(bannerContentUnwrapPlugin)
        .addKeymap(
            () => ({
                Enter: keepEmptyBannerContentText,
                Backspace: chainCommands(clearBannerContent, stopAtBannerContentStart),
                Delete: chainCommands(clearBannerContent, stopAtBannerContentEnd),
            }),
            builder.Priority.High,
        );
};
