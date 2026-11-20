import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import type {HeaderOptions} from '../Header';

import {WHeaderImageNodeView} from './HeaderImageNodeView';
import {headerImageNodeName} from './HeaderImageSpecs';
import {
    removeSelectedHeaderImage,
    selectHeaderImageAfter,
    selectHeaderImageBefore,
} from './commands';
import {headerImageClickPlugin} from './plugins/HeaderImageClickPlugin';
import {headerImagePopup} from './plugins/HeaderImagePopupPlugin';

export const HeaderImage: ExtensionAuto<HeaderOptions> = (builder, options) => {
    const popup = headerImagePopup(options);
    builder
        .addNodeView(
            headerImageNodeName,
            () => (node, view) => new WHeaderImageNodeView(node, view),
        )
        .addPlugin(popup.plugin)
        .addPlugin(() => headerImageClickPlugin(popup.show))
        .addKeymap(
            () => ({
                Backspace: chainCommands(removeSelectedHeaderImage, selectHeaderImageBefore),
                Delete: chainCommands(removeSelectedHeaderImage, selectHeaderImageAfter),
            }),
            builder.Priority.High,
        )
        .addKeymap(() => ({Tab: popup.focus}), builder.Priority.VeryHigh);
};
