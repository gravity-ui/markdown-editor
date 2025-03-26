import type {EditorView} from '#pm/view';
import {getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import type {Logger2} from 'src/logger';
import {ArrayCarousel} from 'src/utils/carousel';

import {DEFAULT_DECORATION_CLASS_NAME, SuggestAction, type SuggestHandler} from './plugin';
import {renderPopup} from './react-components';
import type {SuggestItem} from './types';

type SuggestOpenState = {
    url: string;
    carousel: ArrayCarousel<SuggestItem>;
};

export type LinkSuggestHandlerParams = {
    logger: Logger2.ILogger;
    items: readonly SuggestItem[];
};

export class LinkSuggestHandler implements SuggestHandler {
    readonly #view: EditorView;
    readonly #logger: Logger2.ILogger;
    readonly #items: readonly SuggestItem[];
    readonly #renderItem;

    #state: SuggestOpenState | null = null;
    #anchor: Element | null = null;

    constructor(view: EditorView, {logger, items}: LinkSuggestHandlerParams) {
        this.#view = view;
        this.#items = items;
        this.#logger = logger;

        this.#renderItem = getReactRendererFromState(view.state).createItem(
            'link-transform-suggest',
            () =>
                this.#state
                    ? renderPopup({
                          anchorElement: this.#anchor,
                          items: this.#state.carousel.array,
                          currentIndex: this.#state.carousel.currentIndex,
                      })
                    : null,
        );
    }

    open(): void {
        const url = '';

        this._initState(url);
        if (!this._validateAvailableItems()) {
            SuggestAction.closeSuggest(this.#view.state, this.#view.dispatch);
            return;
        }

        this._findAnchor();
        this.#renderItem.rerender();
    }

    close(): void {
        this.#state = null;
        this.#anchor = null;
        this.#renderItem.rerender();
    }

    update(): void {
        const url = '';

        if (url !== this.#state?.url) {
            this._initState(url);
            if (!this._validateAvailableItems()) {
                SuggestAction.closeSuggest(this.#view.state, this.#view.dispatch);
                return;
            }
        }

        this._findAnchor();
        this.#renderItem.rerender();
    }

    destroy(): void {
        this.#state = null;
        this.#anchor = null;
        this.#renderItem.remove();
    }

    onEscape(): boolean {
        throw new Error('Method not implemented.');
    }

    onEnter(): boolean {
        throw new Error('Method not implemented.');
    }

    onUp(): boolean {
        throw new Error('Method not implemented.');
    }

    onDown(): boolean {
        throw new Error('Method not implemented.');
    }

    private _findAnchor() {
        const {dom} = this.#view;
        this.#anchor = dom.getElementsByClassName(DEFAULT_DECORATION_CLASS_NAME).item(0);
    }

    private _initState(url: string) {
        this.#state = null;

        const carousel = new ArrayCarousel(this.#items.filter((item) => item.testUrl(url)));
        if (carousel.currentIndex === -1) return;

        this.#state = {url, carousel};
    }

    private _validateAvailableItems(): boolean {
        const state = this.#state;
        if (!state) return false;

        if (state.carousel.array.length === 1 && state.carousel.array[0].id === 'url') return false;

        return true;
    }
}
