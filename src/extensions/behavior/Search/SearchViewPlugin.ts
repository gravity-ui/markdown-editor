import {SearchQuery, type SearchResult, getSearchState, setSearchState} from 'prosemirror-search';

import type {Node} from '#pm/model';
import {type Command, Plugin, type PluginView, TextSelection} from '#pm/state';
import {findParentNodeClosestToPos} from '#pm/utils';
import type {EditorView} from '#pm/view';
import {type SearchCounter, type SearchState, renderSearchPopup} from 'src/modules/search';
import {isElementInViewport} from 'src/utils/dom';

import {getReactRendererFromState} from '../ReactRenderer';

import {closeSearch, findNext, findPrev, replaceAll, replaceNext} from './commands';
import {SearchClassName, pluginKey} from './const';
import {searchKeyHandler} from './key-handler';
import type {SearchViewState} from './types';
import {startTracking} from './utils/connect-tracker';
import {FocusManager} from './utils/focus-manager';
import {getCounter} from './utils/search-counter';

import './search-plugin.scss';

export interface SearchViewPluginParams {
    anchorSelector: string;
}

export const searchViewPlugin = (params: SearchViewPluginParams) => {
    return new Plugin<SearchViewState>({
        key: pluginKey,
        props: {
            handleKeyDown: searchKeyHandler,
        },
        state: {
            init: () => ({open: false}),
            apply(tr, value, _oldState, _newState) {
                const newValue = tr.getMeta(pluginKey) as SearchViewState | undefined;
                if (typeof newValue === 'object') return newValue;
                return value;
            },
        },
        view(view) {
            return new SeachPluginView(view, params);
        },
    });
};

class SeachPluginView implements PluginView {
    private readonly _view: EditorView;
    private readonly _renderer;
    private readonly _focusManager: FocusManager;
    private readonly _viewDomTrackerDispose;

    private _counter: SearchCounter;
    private _isDomConnected: boolean;
    private _viewState: SearchViewState | undefined;
    private _searchState: SearchQuery | undefined;

    constructor(view: EditorView, params: SearchViewPluginParams) {
        this._view = view;
        this._viewState = pluginKey.getState(view.state);
        this._searchState = getSearchState(view.state)?.query;
        this._counter = getCounter(view.state);
        this._isDomConnected = view.dom.ownerDocument.contains(view.dom);

        this._renderer = this._createRenderer(params);
        this._focusManager = new FocusManager(view.dom.ownerDocument);

        // uses MutationObserver to detect when view.dom is disconnected from the DOM tree
        // TODO: replace with eventBus (subscribe to change-editor-mode event) to track when to hide the search bar
        // see https://github.com/gravity-ui/markdown-editor/issues/884
        this._viewDomTrackerDispose = startTracking(view.dom, {
            onConnect: this._onEditorViewDomConnected,
            onDisconnect: this._onEditorViewDomDisconnected,
        });
    }

    update() {
        const newCounter = getCounter(this._view.state);
        const newViewState = pluginKey.getState(this._view.state);
        const newSearchState = getSearchState(this._view.state)?.query;

        if (
            newViewState !== this._viewState ||
            newSearchState !== this._searchState ||
            newCounter.total !== this._counter.total ||
            newCounter.current !== this._counter.current
        ) {
            this._counter = newCounter;
            this._viewState = newViewState;
            this._searchState = newSearchState;
            this._renderer.rerender();
        }
    }

    destroy() {
        this._renderer.remove();
        this._viewDomTrackerDispose();
    }

    private _onEditorViewDomConnected = () => {
        this._isDomConnected = true;
        this._renderer.rerender();
    };

    private _onEditorViewDomDisconnected = () => {
        this._isDomConnected = false;
        this._onClose();
    };

    private _createRenderer(params: Pick<SearchViewPluginParams, 'anchorSelector'>) {
        return getReactRendererFromState(this._view.state).createItem('search-view', () => {
            const {
                _viewState: viewState,
                _searchState: searchState,
                _isDomConnected: domConnected,
            } = this;

            if (!domConnected || !viewState?.open || !searchState) return null;

            const anchor = this._view.dom.ownerDocument.querySelector(params.anchorSelector);

            return renderSearchPopup({
                anchor,
                open: viewState.open,
                counter: this._counter,
                state: searchState,
                onClose: this._onClose,
                onChange: this._onChange,
                onSearchPrev: this._onSearchPrev,
                onSearchNext: this._onSearchNext,
                onReplaceNext: this._onReplaceNext,
                onReplaceAll: this._onReplaceAll,
            });
        });
    }

    private _onChange = (config: SearchState) => {
        const {state, dispatch} = this._view;

        const query = new SearchQuery({
            search: config.search,
            replace: config.replace,
            caseSensitive: config.caseSensitive,
            wholeWord: config.wholeWord,
        });

        const tr = setSearchState(state.tr, query);
        const {$from, $to} = tr.selection;
        const parent = findParentNodeClosestToPos($from, (node: Node) => node.type.isTextblock);

        let result: SearchResult | null = null;
        // find match in [sel.$from, parent.$end]
        if (parent) result = query.findNext(state, $from.pos, parent.pos + parent.node.nodeSize);
        // find match in [parent.$start or sel.$from, doc.$end]
        if (!result) result = query.findNext(state, parent?.pos || $from.pos);
        // find match in [doc.$start, parent.$start or sel.$to]
        if (!result) result = query.findPrev(state, parent?.pos || $to.pos);
        // update text selection
        if (result) tr.setSelection(TextSelection.create(tr.doc, result.from, result.to));

        dispatch(tr);
    };

    private _onClose = () => {
        closeSearch(this._view.state, this._view.dispatch);
        this._view.focus();
    };

    private _onSearchPrev = () => {
        this._preserveFocus(findPrev);
        requestAnimationFrame(() => this._scrollToActiveIfNeeded());
    };

    private _onSearchNext = () => {
        this._preserveFocus(findNext);
        requestAnimationFrame(() => this._scrollToActiveIfNeeded());
    };

    private _onReplaceNext = () => {
        this._preserveFocus(replaceNext);
    };

    private _onReplaceAll = () => {
        this._preserveFocus(replaceAll);
    };

    private _preserveFocus(command: Command) {
        this._focusManager.storeFocus();
        this._view.focus();
        command(this._view.state, this._view.dispatch, this._view);
        this._focusManager.restoreFocus({preventScroll: true});
    }

    private _scrollToActiveIfNeeded = () => {
        const activeElem = this._view.dom
            .getElementsByClassName(SearchClassName.ActiveMatch)
            .item(0);

        if (activeElem && !isElementInViewport(activeElem)) {
            activeElem.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
            });
        }
    };
}
