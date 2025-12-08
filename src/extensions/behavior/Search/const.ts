import {PluginKey} from '#pm/state';

import type {SearchViewState} from './types';

export const SearchClassName = {
    Match: 'ProseMirror-search-match',
    ActiveMatch: 'ProseMirror-active-search-match',
} as const;

export const pluginKey = new PluginKey<SearchViewState>('search-view');
