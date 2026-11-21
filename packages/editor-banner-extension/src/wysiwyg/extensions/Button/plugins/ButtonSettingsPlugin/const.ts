import {PluginKey, type Transaction} from '@gravity-ui/markdown-editor/pm/state';

export const buttonSettingsKey = new PluginKey<boolean>('button-settings');

export const openButtonSettings = (tr: Transaction, open = true) =>
    tr.setMeta(buttonSettingsKey, open);
