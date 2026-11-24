import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import {WBannerImageNodeView} from './BannerImageNodeView';
import {bannerImageNodeName} from './BannerImageSpecs';
import {
    removeSelectedBannerImage,
    selectBannerImageAfter,
    selectBannerImageBefore,
} from './commands';
import {bannerImageClickPlugin} from './plugins/BannerImageClickPlugin';
import {bannerImageGuardPlugin} from './plugins/BannerImageGuardPlugin';

/** The view of the banner image; its specs come with `BannerSpecs`. */
export const BannerImage: ExtensionAuto = (builder) => {
    builder
        .addNodeView(
            bannerImageNodeName,
            () => (node, view) => new WBannerImageNodeView(node, view),
        )
        .addPlugin(bannerImageClickPlugin)
        .addPlugin(bannerImageGuardPlugin)
        .addKeymap(
            () => ({
                Backspace: chainCommands(removeSelectedBannerImage, selectBannerImageBefore),
                Delete: chainCommands(removeSelectedBannerImage, selectBannerImageAfter),
            }),
            builder.Priority.High,
        );
};
