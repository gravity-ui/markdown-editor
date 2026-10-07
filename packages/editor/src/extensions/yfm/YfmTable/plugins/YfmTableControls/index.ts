import type {ExtensionDeps} from '#core';

import {yfmTableDndPlugin} from './plugins/dnd-plugin';
import {yfmTableFocusPlugin} from './plugins/focus-plugin';
import {yfmTableHeaderRowsPlugin} from './plugins/header-rows-plugin';
import {yfmTableSelectionPlugin} from './plugins/selection-plugin';

export type YfmTableControlsPluginsOpts = {
    dndEnabled: boolean;
    headerRowsEnabled: boolean;
    cellBackgroundEnabled: boolean;
};

export const yfmTableControlsPlugins =
    (opts: YfmTableControlsPluginsOpts) => (_deps: ExtensionDeps) => [
        yfmTableFocusPlugin(opts),
        yfmTableDndPlugin(),
        yfmTableSelectionPlugin(opts),
        ...(opts.headerRowsEnabled ? [yfmTableHeaderRowsPlugin()] : []),
    ];
