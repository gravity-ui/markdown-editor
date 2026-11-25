import type {PluginSimple} from 'markdown-it';

import {bannerPlugin} from './banner/plugin';
import {bannerContentPlugin} from './banner-content/plugin';
import {bannerImagePlugin} from './banner-image/plugin';
import {bannerTitlePlugin} from './banner-title/plugin';
import {buttonPlugin} from './button/plugin';

const plugins: readonly PluginSimple[] = [
    bannerPlugin,
    bannerTitlePlugin,
    bannerContentPlugin,
    bannerImagePlugin,
    buttonPlugin,
];

export const bannerPreset: PluginSimple = (md) => {
    for (const plugin of plugins) md.use(plugin);
};
