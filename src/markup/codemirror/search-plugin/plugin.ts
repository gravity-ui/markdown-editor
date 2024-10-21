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

import type {MarkdownEditorMode} from '../../../bundle';
import type {EventMap} from '../../../bundle/Editor';
import type {RendererItem} from '../../../extensions';
import {debounce} from '../../../lodash';
import {Receiver} from '../../../utils';
import {ReactRendererFacet} from '../react-facet';

import {renderSearchPopup} from './view/SearchPopup';

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

export interface SearchPanelPluginParams {
    anchorSelector: string;
    inputDelay?: number;
    receiver?: Receiver<EventMap>;
}

export const SearchPanelPlugin = (params: SearchPanelPluginParams) =>
    ViewPlugin.fromClass(
        class implements PluginValue {
            readonly view: EditorView;
            readonly params: SearchPanelPluginParams;

            anchor: HTMLElement | null;
            renderer: RendererItem | null;
            searchQuery: SearchQueryParams = {
                search: '',
                caseSensitive: false,
                wholeWord: false,
            };
            receiver: Receiver<EventMap> | undefined;

            setViewSearchWithDelay: (config: Partial<SearchQueryParams>) => void;

            constructor(view: EditorView) {
                this.view = view;
                this.anchor = null;
                this.renderer = null;
                this.params = params;
                this.receiver = params.receiver;

                this.handleClose = this.handleClose.bind(this);
                this.handleChange = this.handleChange.bind(this);
                this.handleSearchNext = this.handleSearchNext.bind(this);
                this.handleSearchPrev = this.handleSearchPrev.bind(this);
                this.handleSearchConfigChange = this.handleSearchConfigChange.bind(this);
                this.handleEditorModeChange = this.handleEditorModeChange.bind(this);

                this.setViewSearchWithDelay = debounce(
                    this.setViewSearch,
                    this.params.inputDelay ?? INPUT_DELAY,
                );
                this.receiver?.on('change-editor-mode', this.handleEditorModeChange);
            }

            update(update: ViewUpdate): void {
                const isPanelOpen = searchPanelOpen(update.state);

                if (isPanelOpen && !this.renderer) {
                    this.anchor = document.querySelector(this.params.anchorSelector);
                    this.renderer = this.view.state
                        .facet(ReactRendererFacet)
                        .createItem('cm-search', () =>
                            renderSearchPopup({
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
                this.receiver?.off('change-editor-mode', this.handleEditorModeChange);
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

            handleEditorModeChange({mode}: {mode: MarkdownEditorMode}) {
                if (mode === 'wysiwyg') {
                    closeSearchPanel(this.view);
                }
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
