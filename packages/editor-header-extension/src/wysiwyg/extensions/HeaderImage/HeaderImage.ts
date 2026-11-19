import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import {WHeaderImageNodeView} from './HeaderImageNodeView';
import {headerImageNodeName} from './HeaderImageSpecs';
import {
    removeSelectedHeaderImage,
    selectHeaderImageAfter,
    selectHeaderImageBefore,
} from './commands';
import {headerImageClickPlugin} from './plugins/HeaderImageClickPlugin';
import {headerImageGuardPlugin} from './plugins/HeaderImageGuardPlugin';

/** The view of the banner image; its specs come with `HeaderSpecs`. */
export const HeaderImage: ExtensionAuto = (builder) => {
    builder
        .addNodeView(
            headerImageNodeName,
            () => (node, view) => new WHeaderImageNodeView(node, view),
        )
        .addPlugin(headerImageClickPlugin)
        .addPlugin(headerImageGuardPlugin)
        .addKeymap(
            () => ({
                Backspace: chainCommands(removeSelectedHeaderImage, selectHeaderImageBefore),
                Delete: chainCommands(removeSelectedHeaderImage, selectHeaderImageAfter),
            }),
            builder.Priority.High,
        );
};
