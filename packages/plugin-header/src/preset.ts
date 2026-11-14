import type {PluginSimple} from 'markdown-it';

import {buttonPlugin} from './button';
import {headerPlugin} from './header';
import {headerContentPlugin} from './header-content';
import {headerImagePlugin} from './header-image';
import {headerTitlePlugin} from './header-title';

/** One plugin per block; each one also works on its own. */
const plugins: readonly PluginSimple[] = [
    headerPlugin,
    headerTitlePlugin,
    headerContentPlugin,
    headerImagePlugin,
    buttonPlugin,
];

/** Enables every block of the Header markup. */
export const headerPreset: PluginSimple = (md) => {
    for (const plugin of plugins) md.use(plugin);
};
