import type {PluginSimple} from 'markdown-it';

import {bannerPlugin} from './banner/plugin';
import {buttonPlugin} from './button/plugin';

const plugins: readonly PluginSimple[] = [bannerPlugin, buttonPlugin];

export const bannerPreset: PluginSimple = (md) => {
    for (const plugin of plugins) md.use(plugin);
};
