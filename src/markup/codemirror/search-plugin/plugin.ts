import React from 'react';

import {
    SearchQuery,
    closeSearchPanel,
    findNext,
    findPrevious,
    search,
    searchKeymap,
    searchPanelOpen,
    setSearchQuery,
} from '@codemirror/search';
import {EditorView, PluginValue, ViewPlugin, ViewUpdate, keymap} from '@codemirror/view';

import type {RendererItem} from '../../../extensions';
import {debounce} from '../../../lodash';
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

const INPUT_DELAY = 200;

export interface Options {
    inputDelay?: number;
    anchorSelector?: string;
}

const defaultOptions: Options = {
    inputDelay: 200,
};

export const SearchPanelPlugin = (options: Options = defaultOptions) =>
    ViewPlugin.fromClass(
        class implements PluginValue {
            readonly view: EditorView;
            readonly options: Options;

            anchor: HTMLElement | null;
            renderer: RendererItem | null;
            searchQuery: SearchQueryParams = {
                search: '',
                caseSensitive: false,
                wholeWord: false,
            };
            setViewSearchWithDelay: (config: Partial<SearchQueryParams>) => void;

            constructor(view: EditorView) {
                this.view = view;
                this.anchor = null;
                this.renderer = null;
                this.options = options;

                this.handleClose = this.handleClose.bind(this);
                this.handleChange = this.handleChange.bind(this);
                this.handleSearchNext = this.handleSearchNext.bind(this);
                this.handleSearchPrev = this.handleSearchPrev.bind(this);
                this.handleSearchConfigChange = this.handleSearchConfigChange.bind(this);
                this.setViewSearchWithDelay = debounce(
                    this.setViewSearch,
                    this.options.inputDelay ?? INPUT_DELAY,
                );
            }

            update(update: ViewUpdate): void {
                const isPanelOpen = searchPanelOpen(update.state);

                if (isPanelOpen && !this.renderer) {
                    this.anchor =
                        this.anchor ?? document.querySelector(this.options.anchorSelector ?? '');
                    this.renderer = this.view.state
                        .facet(ReactRendererFacet)
                        .createItem('cm-search', () =>
                            React.createElement(PortalWithPopup, {
                                open: true,
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
                this.renderer = null;
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
                this.setViewSearchWithDelay({search});
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
        {
            provide: () => [
                keymap.of(searchKeymap),
                search({
                    createPanel: () => ({
                        // Create an empty search panel
                        dom: document.createElement('div'),
                    }),
                }),
            ],
        },
    );
