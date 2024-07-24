import React from 'react';

import {
    SearchQuery,
    closeSearchPanel,
    findNext,
    findPrevious,
    search,
    searchPanelOpen,
    setSearchQuery,
} from '@codemirror/search';
import {EditorView, PluginValue, ViewPlugin, ViewUpdate} from '@codemirror/view';

import type {RendererItem} from '../../../extensions';
import {ReactRendererFacet} from '../react-facet';

import {PortalWithPopup} from './view/SearchPopup';

interface SearchQueryParams {
    search: string;
    caseSensitive?: boolean;
    literal?: boolean;
    regexp?: boolean;
    replace?: string;
    valid?: boolean;
    wholeWord?: boolean;
}

export const SearchPanelPlugin = ViewPlugin.fromClass(
    class implements PluginValue {
        readonly view: EditorView;

        anchor: HTMLElement | null;
        renderer: RendererItem | null;
        searchQuery: SearchQueryParams = {
            search: '',
            caseSensitive: false,
            wholeWord: false,
        };

        constructor(view: EditorView) {
            this.view = view;
            this.anchor = null;
            this.renderer = null;

            this.handleClose = this.handleClose.bind(this);
            this.handleChange = this.handleChange.bind(this);
            this.handleSearchNext = this.handleSearchNext.bind(this);
            this.handleSearchPrev = this.handleSearchPrev.bind(this);
            this.handleSearchConfigChange = this.handleSearchConfigChange.bind(this);
        }

        update(update: ViewUpdate): void {
            const isPanelOpen = searchPanelOpen(update.state);

            if (isPanelOpen && !this.renderer) {
                this.anchor = this.anchor ?? document.querySelector('.g-md-search-anchor');
                this.renderer = this.view.state
                    .facet(ReactRendererFacet)
                    .createItem('cm-search', () =>
                        React.createElement(PortalWithPopup, {
                            anchor: this.anchor,
                            onChange: this.handleChange,
                            onClose: this.handleClose,
                            onSearchNext: this.handleSearchNext,
                            onSearchPrev: this.handleSearchPrev,
                            onConfigChange: this.handleSearchConfigChange,
                        }),
                    );
            } else if (!isPanelOpen && this.renderer) {
                this.renderer?.remove();
                this.renderer = null;
            }
        }

        destroy() {
            this.renderer?.remove();
        }

        setViewSearch(config: Partial<SearchQueryParams>) {
            this.searchQuery = {
                ...this.searchQuery,
                ...config,
            };
            const searchQuery = new SearchQuery({
                ...this.searchQuery,
            });

            this.view.dispatch({effects: setSearchQuery.of(searchQuery)});
        }

        handleChange(search: string) {
            // TODO: @makhnatkin add debounce
            this.setViewSearch({search});
        }

        handleClose() {
            this.setViewSearch({search: ''});
            closeSearchPanel(this.view);
        }

        handleSearchNext() {
            findNext(this.view);
        }

        handleSearchPrev() {
            findPrevious(this.view);
        }

        handleSearchConfigChange({
            isCaseSensitive,
            isWholeWord,
        }: {
            isCaseSensitive?: boolean;
            isWholeWord?: boolean;
        }) {
            this.setViewSearch({
                caseSensitive: isCaseSensitive,
                wholeWord: isWholeWord,
            });
        }
    },
    {},
);

export const removeDefaultSearch = search({
    createPanel: () => ({
        // Create an empty search panel
        dom: document.createElement('div'),
    }),
});
