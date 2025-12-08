import {
    SearchQuery,
    closeSearchPanel,
    findNext,
    findPrevious,
    getSearchQuery,
    replaceAll,
    replaceNext,
    search,
    searchKeymap,
    searchPanelOpen,
    setSearchQuery,
} from '@codemirror/search';
import {
    type EditorView,
    type PluginValue,
    ViewPlugin,
    type ViewUpdate,
    keymap,
} from '@codemirror/view';

import type {MarkdownEditorMode} from 'src/bundle';
import type {EventMap} from 'src/bundle/Editor';
import type {RendererItem} from 'src/extensions';
import {renderSearchPopup} from 'src/modules/search';
import type {Receiver} from 'src/utils';

import {ReactRendererFacet} from '../react-facet';

import {searchTheme} from './theme';

type SearchQueryConfig = ConstructorParameters<typeof SearchQuery>[0];

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

            renderer: RendererItem;
            receiver: Receiver<EventMap> | undefined;

            panelOpened: boolean;
            searchState: SearchQuery | null;

            constructor(view: EditorView) {
                this.view = view;
                this.params = params;
                this.receiver = params.receiver;

                this.panelOpened = searchPanelOpen(view.state);
                this.searchState = getSearchQuery(view.state);
                this.renderer = this.createRenderer();

                this.handleClose = this.handleClose.bind(this);
                this.handleChange = this.handleChange.bind(this);
                this.handleSearchNext = this.handleSearchNext.bind(this);
                this.handleSearchPrev = this.handleSearchPrev.bind(this);
                this.handleReplaceNext = this.handleReplaceNext.bind(this);
                this.handleReplaceAll = this.handleReplaceAll.bind(this);
                this.handleEditorModeChange = this.handleEditorModeChange.bind(this);

                this.receiver?.on('change-editor-mode', this.handleEditorModeChange);
            }

            update(update: ViewUpdate): void {
                const isPanelOpen = searchPanelOpen(update.state);
                const searchQuery = getSearchQuery(update.state);

                if (isPanelOpen !== this.panelOpened || searchQuery !== this.searchState) {
                    this.panelOpened = isPanelOpen;
                    this.searchState = searchQuery;
                    this.renderer.rerender();
                }
            }

            destroy() {
                this.renderer.remove();
                this.receiver?.off('change-editor-mode', this.handleEditorModeChange);
            }

            createRenderer() {
                return this.view.state.facet(ReactRendererFacet).createItem('cm-search', () => {
                    if (!this.panelOpened || !this.searchState) return null;

                    const anchor = this.view.dom.ownerDocument.querySelector(
                        this.params.anchorSelector,
                    );

                    if (!anchor) return null;

                    return renderSearchPopup({
                        open: true,
                        anchor: anchor,
                        state: this.searchState,
                        onClose: this.handleClose,
                        onChange: this.handleChange,
                        onSearchNext: this.handleSearchNext,
                        onSearchPrev: this.handleSearchPrev,
                        onReplaceNext: this.handleReplaceNext,
                        onReplaceAll: this.handleReplaceAll,
                    });
                });
            }

            handleEditorModeChange({mode}: {mode: MarkdownEditorMode}) {
                if (mode === 'wysiwyg') {
                    closeSearchPanel(this.view);
                }
            }

            handleChange(config: SearchQueryConfig) {
                this.view.dispatch({
                    effects: setSearchQuery.of(
                        new SearchQuery({
                            search: config.search,
                            replace: config.replace,
                            caseSensitive: config.caseSensitive,
                            wholeWord: config.wholeWord,
                        }),
                    ),
                });
            }

            handleClose() {
                this.handleChange({search: ''});
                closeSearchPanel(this.view);
                this.view.focus();
            }

            handleSearchNext() {
                findNext(this.view);
            }

            handleSearchPrev() {
                findPrevious(this.view);
            }

            handleReplaceNext() {
                replaceNext(this.view);
            }

            handleReplaceAll() {
                replaceAll(this.view);
            }
        },
        {
            provide: () => [
                keymap.of(searchKeymap),
                searchTheme,
                search({
                    createPanel: () => ({
                        // Create an empty search panel
                        dom: document.createElement('div'),
                    }),
                }),
            ],
        },
    );
