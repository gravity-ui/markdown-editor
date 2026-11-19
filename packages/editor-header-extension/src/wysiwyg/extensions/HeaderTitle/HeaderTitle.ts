import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';
import {chainCommands} from '@gravity-ui/markdown-editor/pm/commands';

import {selectionInsidePlugin} from '../../plugins/SelectionInsidePlugin';

import {headerTitleNodeType} from './HeaderTitleSpecs';
import {
    deleteHeaderTitleText,
    leaveHeaderTitle,
    stopAtHeaderTitleEnd,
    stopAtHeaderTitleStart,
} from './commands';
import {headerTitleGuardPlugin} from './plugins/HeaderTitleGuardPlugin';
import {headerTitlePastePlugin, headerTitleTextPastePlugin} from './plugins/HeaderTitlePastePlugin';

/** The editing of the banner title; `Header` uses it, and `HeaderSpecs` holds its schema. */
export const HeaderTitle: ExtensionAuto = (builder) => {
    builder
        .addPlugin(() => selectionInsidePlugin(headerTitleNodeType))
        .addPlugin(headerTitleGuardPlugin, builder.Priority.High)
        .addPlugin(headerTitlePastePlugin, builder.Priority.High)
        .addPlugin(headerTitleTextPastePlugin, builder.Priority.VeryHigh)
        .addKeymap(
            () => ({
                Enter: leaveHeaderTitle,
                Backspace: chainCommands(deleteHeaderTitleText, stopAtHeaderTitleStart),
                Delete: chainCommands(deleteHeaderTitleText, stopAtHeaderTitleEnd),
            }),
            builder.Priority.High,
        );
};
