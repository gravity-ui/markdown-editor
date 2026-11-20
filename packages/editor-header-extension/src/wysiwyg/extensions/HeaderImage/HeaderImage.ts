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
import {headerImageGuardPlugin} from './plugins/HeaderImageGuardPlugin';
import {headerImagePopupPlugin} from './plugins/HeaderImagePopupPlugin';

/** The view and the window of the banner image; its specs come with `HeaderSpecs`. */
export const HeaderImage: ExtensionAuto<HeaderOptions> = (builder, options) => {
    builder
        .addNodeView(
            headerImageNodeName,
            () => (node, view) => new WHeaderImageNodeView(node, view),
        )
        .addPlugin(headerImageClickPlugin)
        .addPlugin(headerImageGuardPlugin)
        .addPlugin(() => headerImagePopupPlugin(options))
        .addKeymap(
            () => ({
                Backspace: chainCommands(removeSelectedHeaderImage, selectHeaderImageBefore),
                Delete: chainCommands(removeSelectedHeaderImage, selectHeaderImageAfter),
            }),
            builder.Priority.High,
        );
};
