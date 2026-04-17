import {PluginKey} from 'prosemirror-state';
import type {DecorationSet} from 'prosemirror-view';

const key = new PluginKey<DecorationSet>('gpt-widget');
export {key as pluginKey};
