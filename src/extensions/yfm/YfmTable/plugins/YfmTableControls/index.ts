import type {ExtensionDeps} from '#core';

import {yfmTableDndPlugin} from './plugins/dnd-plugin';
import {yfmTableFocusPlugin} from './plugins/focus-plugin';

export const yfmTableControlsPlugins = (opts: {dndEnabled: boolean}) => (_deps: ExtensionDeps) => [
    yfmTableFocusPlugin(opts),
    yfmTableDndPlugin(),
];
