import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import type {BannerOptions} from '../Banner';

import {WBannerImageNodeView} from './BannerImageNodeView';
import {bannerImageNodeName} from './BannerImageSpecs';
import {
    removeSelectedBannerImage,
    selectBannerImageAfter,
    selectBannerImageBefore,
} from './commands';
import {bannerImageClickPlugin} from './plugins/BannerImageClickPlugin';
import {bannerImageGuardPlugin} from './plugins/BannerImageGuardPlugin';
import {bannerImagePopupPlugin} from './plugins/BannerImagePopupPlugin';

/** The view and the window of the banner image; its specs come with `BannerSpecs`. */
export const BannerImage: ExtensionAuto<BannerOptions> = (builder, options) => {
    builder
        .addNodeView(
            bannerImageNodeName,
            () => (node, view) => new WBannerImageNodeView(node, view),
        )
        .addPlugin(bannerImageClickPlugin)
        .addPlugin(bannerImageGuardPlugin)
        .addPlugin(() => bannerImagePopupPlugin(options))
        .addKeymap(
            () => ({
                Backspace: chainCommands(removeSelectedBannerImage, selectBannerImageBefore),
                Delete: chainCommands(removeSelectedBannerImage, selectBannerImageAfter),
            }),
            builder.Priority.High,
        );
};
