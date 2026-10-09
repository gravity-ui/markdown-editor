import {
    SearchQuery,
    findNext as findNextSearch,
    findPrev as findPrevSearch,
    getSearchState,
    replaceAll as replaceAllSearch,
    replaceNext as replaceNextSearch,
    setSearchState,
} from 'prosemirror-search';

import type {Command} from '#pm/state';

import {hideSelectionMenu} from '../SelectionContext';

import {pluginKey} from './const';
import type {SearchViewState} from './types';
import {wrapCommand} from './utils/wrap-command';

export const findNext = wrapCommand(findNextSearch, hideSelectionMenu);
export const findPrev = wrapCommand(findPrevSearch, hideSelectionMenu);
export const replaceNext = wrapCommand(replaceNextSearch, hideSelectionMenu);
export const replaceAll = wrapCommand(replaceAllSearch, hideSelectionMenu);

export const openSearch: Command = (state, dispatch) => {
    if (dispatch) {
        const searchState = getSearchState(state);
        const search = state.doc.textBetween(state.selection.from, state.selection.to, ' ');
        const meta: SearchViewState = {open: true};
        dispatch(
            setSearchState(
                hideSelectionMenu(state.tr.setMeta(pluginKey, meta)),
                new SearchQuery({
                    ...(searchState
                        ? {
                              regexp: searchState.query.regexp,
                              replace: searchState.query.replace,
                              literal: searchState.query.literal,
                              wholeWord: searchState.query.wholeWord,
                              caseSensitive: searchState.query.caseSensitive,
                              filter: searchState.query.filter || undefined,
                          }
                        : undefined),
                    search,
                }),
            ),
        );
    }
    return true;
};

export const closeSearch: Command = (state, dispatch) => {
    if (dispatch) {
        const meta: SearchViewState = {open: false};
        dispatch(setSearchState(state.tr.setMeta(pluginKey, meta), new SearchQuery({search: ''})));
    }
    return true;
};
