import type {PluginSimple} from 'markdown-it';

import {buttonPlugin} from './button';
import {headerPlugin} from './header';

/** One plugin per block; each one also works on its own. */
export const headerPresetPlugins: readonly PluginSimple[] = [headerPlugin, buttonPlugin];

/** Enables every block of the Header markup. */
export const headerPreset: PluginSimple = (md) => {
    for (const plugin of headerPresetPlugins) md.use(plugin);
};
