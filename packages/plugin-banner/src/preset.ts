import type {PluginSimple} from 'markdown-it';

import {bannerPlugin} from './banner';
import {bannerContentPlugin} from './banner-content';
import {bannerImagePlugin} from './banner-image';
import {bannerTitlePlugin} from './banner-title';
import {buttonPlugin} from './button';

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
