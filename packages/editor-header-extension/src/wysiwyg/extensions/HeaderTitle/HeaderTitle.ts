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
import {headerTitleTooltip} from './plugins/HeaderTitleTooltipPlugin';

import '@gravity-ui/markdown-plugin-header/header-title/styles.css';

export const HeaderTitle: ExtensionAuto = (builder) => {
    const tooltip = headerTitleTooltip();
    builder
        .addPlugin(tooltip.plugin)
        .addPlugin(() => selectionInsidePlugin(headerTitleNodeType))
        .addPlugin(headerTitleGuardPlugin, builder.Priority.High)
        .addKeymap(
            () => ({
                Enter: leaveHeaderTitle,
                Backspace: chainCommands(deleteHeaderTitleText, stopAtHeaderTitleStart),
                Delete: chainCommands(deleteHeaderTitleText, stopAtHeaderTitleEnd),
            }),
            builder.Priority.High,
        )
        .addKeymap(() => ({Tab: tooltip.focus()}), builder.Priority.VeryHigh);
};
