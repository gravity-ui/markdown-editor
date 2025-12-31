import {search} from 'prosemirror-search';

import type {ExtensionAuto} from '#core';

import {type SearchViewPluginParams, searchViewPlugin} from './SearchViewPlugin';

export type SearchOptions = Pick<SearchViewPluginParams, 'anchorSelector'>;

export const Search: ExtensionAuto<SearchOptions> = (builder, opts) => {
    builder.addPlugin(() => [search(), searchViewPlugin(opts)]);
};
