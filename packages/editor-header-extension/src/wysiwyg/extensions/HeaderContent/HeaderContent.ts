import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import {selectionInsidePlugin} from '../../plugins/SelectionInsidePlugin';

import {headerContentNodeType} from './HeaderContentSpecs';
import {
    clearHeaderContent,
    keepEmptyHeaderContentText,
    stopAtHeaderContentEnd,
    stopAtHeaderContentStart,
} from './commands';

export const HeaderContent: ExtensionAuto = (builder) => {
    builder
        .addPlugin(() => selectionInsidePlugin(headerContentNodeType))
        .addKeymap(
            () => ({
                Enter: keepEmptyHeaderContentText,
                Backspace: chainCommands(clearHeaderContent, stopAtHeaderContentStart),
                Delete: chainCommands(clearHeaderContent, stopAtHeaderContentEnd),
            }),
            builder.Priority.High,
        );
};
