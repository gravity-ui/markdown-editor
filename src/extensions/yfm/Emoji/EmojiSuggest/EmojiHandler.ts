import {Schema} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

import {AutocompletePopupCloser} from '../../../../utils/autocomplete-popup';
import {ArrayCarousel} from '../../../../utils/carousel';
import {RendererItem, getReactRendererFromState} from '../../../behavior';
import {
    AutocompleteAction,
    AutocompleteActionKind,
    AutocompleteHandler,
    FromTo,
    closeAutocomplete,
} from '../../../behavior/Autocomplete';
import {EmojiConsts} from '../EmojiSpecs';

import {EmojiSuggestComponentProps, render} from './EmojiSuggestComponent';
import type {EmojiDef} from './types';
import {findDecoElem} from './utils';

const emptyArray = new Array<string>(0);

export type EmojiHandlerParams = {
    defs: Record<string, string>;
    shortcuts?: Partial<Record<string, string | string[]>>;
};

export class EmojiHandler implements AutocompleteHandler {
    private readonly _emojis: readonly EmojiDef[];
    private _emojiCarousel?: ArrayCarousel<EmojiDef>;

    private _view?: EditorView;
    private _anchor: Element | null = null;
    private _range?: FromTo;
    private _popupCloser?: AutocompletePopupCloser;

    private _suggestProps?: EmojiSuggestComponentProps;
    private _suggestRenderItem?: RendererItem;

    constructor({defs, shortcuts = {}}: EmojiHandlerParams) {
        this._emojis = Object.entries(defs).map(([name, symbol]) => {
            const def: EmojiDef = {symbol, origName: name, name: name.toLowerCase()};
            const short = shortcuts[name];
            if (short) {
                def.origShortcuts = emptyArray.concat(short);
                def.shortcuts = def.origShortcuts.map((val) =>
                    val.startsWith(':') ? val.slice(1) : val,
                );
            }
            return def;
        });
    }

    onOpen(action: AutocompleteAction): boolean {
        this.findAnchor();
        if (!this._anchor) {
            this.closeAutocomplete(action.view);
            return true;
        }

        this._popupCloser = new AutocompletePopupCloser(action.view);
        this.updateState(action);
        this.filterActions();
        this.render();

        return true;
    }

    onFilter(action: AutocompleteAction): boolean {
        if (action.filter?.endsWith('  ')) {
            this.closeAutocomplete(action.view);
            return true;
        }

        this.updateState(action);

        const needToClose = this.filterActions(action.filter?.trim());
        this.render();

        if (needToClose) {
            this.closeAutocomplete(action.view);
        }

        return true;
    }

    onArrow(action: AutocompleteAction): boolean {
        this.updateState(action);

        if (!this._emojiCarousel) return false;

        switch (action.kind) {
            case AutocompleteActionKind.up: {
                this._emojiCarousel.prev();
                break;
            }
            case AutocompleteActionKind.down: {
                this._emojiCarousel.next();
                break;
            }
            default:
                return false;
        }

        this.render();

        return true;
    }

    onEnter(action: AutocompleteAction): boolean {
        this.updateState(action);

        this.select();

        return true;
    }

    onClose(action: AutocompleteAction): boolean {
        this.updateState(action);

        this.clear();

        return true;
    }

    onDestroy(): void {
        this.clear();
    }

    private closeAutocomplete(view: EditorView) {
        setTimeout(() => {
            closeAutocomplete(view);
        });
    }

    private select() {
        const {_view: view, _range: range} = this;
        if (!view || !range) return;

        const emojiDef = this._emojiCarousel?.currentItem;
        if (!emojiDef) return;

        const {tr, schema} = view.state;
        view.dispatch(
            tr.replaceWith(range.from, range.to, createEmoji(schema, emojiDef)).scrollIntoView(),
        );
        view.focus();
    }

    private filterActions(inputText?: string): boolean {
        const currentItem = this._emojiCarousel?.currentItem;

        let filteredEmojis = this._emojis;
        let needToClose = false;

        if (inputText) {
            filteredEmojis = filterEmojis(filteredEmojis, inputText);
            needToClose = !filteredEmojis.length && needToHide(this._emojis, inputText);
        }

        this._emojiCarousel = new ArrayCarousel(filteredEmojis);

        if (currentItem) {
            const newIndex = this._emojiCarousel.array.findIndex((item) => item === currentItem);
            if (newIndex !== -1) {
                this._emojiCarousel.currentIndex = newIndex;
            }
        }

        return needToClose;
    }

    private render() {
        this.findAnchor();
        const viewItems = this._emojiCarousel?.array ?? [];
        this._suggestProps = {
            anchorElement: this._anchor,
            currentIndex: this._emojiCarousel?.currentIndex,
            items: viewItems,
            onClick: this.onItemClick,
            onOpenChange: this._popupCloser?.popupOpenChangeHandler,
        };
        this._suggestRenderItem = this._suggestRenderItem ?? this.createMenuRenderItem();
        this._suggestRenderItem.rerender();
    }

    private onItemClick = (index: number) => {
        if (this._emojiCarousel) {
            this._emojiCarousel.currentIndex = index;
            this.select();
        }
        this._view?.focus();
    };

    private updateState({view, range}: AutocompleteAction) {
        this._view = view;
        this._range = range;
    }

    private clear() {
        this._view = undefined;
        this._range = undefined;
        this._anchor = null;
        this._emojiCarousel = undefined;
        this._popupCloser?.cancelTimer();
        this._popupCloser = undefined;
        this._suggestProps = undefined;
        this._suggestRenderItem?.remove();
        this._suggestRenderItem = undefined;
    }

    private createMenuRenderItem(): RendererItem {
        return getReactRendererFromState(this._view!.state).createItem('emoji_suggest', () =>
            this._suggestProps ? render(this._suggestProps) : null,
        );
    }

    private findAnchor() {
        this._anchor = findDecoElem(this._view?.dom);
    }
}

function createEmoji(schema: Schema, def: EmojiDef) {
    return EmojiConsts.nodeType(schema).create(
        {[EmojiConsts.NodeAttrs.Markup]: def.name},
        schema.text(def.symbol),
    );
}

function filterEmojis(defs: readonly EmojiDef[], text: string): readonly EmojiDef[] {
    if (!text) return defs;
    const textLowerCase = text.toLowerCase();

    const byShortcuts: EmojiDef[] = [];
    const byName: EmojiDef[] = [];
    for (const emoji of defs) {
        if (emoji.shortcuts?.some((val) => val.startsWith(text))) {
            byShortcuts.push(emoji);
        } else if (emoji.name.startsWith(textLowerCase)) {
            byName.push(emoji);
        }
    }
    return byShortcuts.concat(byName);
}

const CHARS_TO_HIDE = 4;
function needToHide(defs: readonly EmojiDef[], text: string): boolean {
    let iter = 1;
    do {
        const prevInput = text.slice(0, text.length - iter);
        const prevActions = filterEmojis(defs, prevInput);
        if (prevActions.length) break;
        iter++;
    } while (iter < text.length && iter < CHARS_TO_HIDE);
    return iter >= CHARS_TO_HIDE;
}
