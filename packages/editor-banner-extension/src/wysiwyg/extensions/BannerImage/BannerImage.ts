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
import {bannerImagePopup} from './plugins/BannerImagePopupPlugin';

export const BannerImage: ExtensionAuto<BannerOptions> = (builder, options) => {
    const popup = bannerImagePopup(() => ({
        ...options,
        fileUploadHandler: builder.context.get('fileUploadHandler'),
    }));
    builder
        .addNodeView(
            bannerImageNodeName,
            () => (node, view) => new WBannerImageNodeView(node, view),
        )
        .addPlugin(popup.plugin)
        .addPlugin(() => bannerImageClickPlugin(popup.show))
        .addKeymap(
            () => ({
                Backspace: chainCommands(removeSelectedBannerImage, selectBannerImageBefore),
                Delete: chainCommands(removeSelectedBannerImage, selectBannerImageAfter),
            }),
            builder.Priority.High,
        )
        .addKeymap(() => ({Tab: popup.focus}), builder.Priority.VeryHigh);
};
