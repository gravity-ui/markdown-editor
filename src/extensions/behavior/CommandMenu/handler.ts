import type {EditorView} from 'prosemirror-view';

import {logger} from '../../..//logger';
import {AutocompletePopupCloser} from '../../..//utils/autocomplete-popup';
import {ArrayCarousel} from '../../..//utils/carousel';
import type {ActionStorage} from '../../../core';
import {isFunction} from '../../../lodash';
import {
    AutocompleteAction,
    AutocompleteActionKind,
    AutocompleteHandler,
    FromTo,
    closeAutocomplete,
} from '../Autocomplete';
import {RendererItem, getReactRendererFromState} from '../ReactRenderer';

import {CommandMenuComponentProps, render} from './component';
import type {CommandAction, Config} from './types';
import {findDecoElem} from './utils';

declare module 'prosemirror-model' {
    interface NodeSpec {
        commandMenu?: boolean;
    }
}

export type CommandHandlerParams = {
    actions: Config;
    storage: ActionStorage;
    nodesIgnoreList?: readonly string[];
};

export class CommandHandler implements AutocompleteHandler {
    readonly #actions: readonly CommandAction[];
    readonly #actionStorage: ActionStorage;
    readonly #nodesIgnoreList: readonly string[];
    #filteredActionsCarousel?: ArrayCarousel<CommandAction>;

    #view?: EditorView;
    #anchor?: Element | null;
    #range?: FromTo;
    #filterText?: string;
    #popupCloser?: AutocompletePopupCloser;

    #menuProps?: CommandMenuComponentProps;
    #menuRenderItem?: RendererItem;

    constructor({actions, storage, nodesIgnoreList = []}: CommandHandlerParams) {
        this.#actions = actions;
        this.#actionStorage = storage;
        this.#nodesIgnoreList = nodesIgnoreList;
    }

    onOpen(action: AutocompleteAction): boolean {
        this.findAnchor();
        if (!this.#anchor || this.shouldIgnore(action)) {
            this.closeAutocomplete(action.view);
            return true;
        }

        this.#popupCloser = new AutocompletePopupCloser(action.view);
        this.updateState(action);
        this.filterActions();
        this.render();

        return true;
    }

    onFilter(action: AutocompleteAction): boolean {
        if (this.shouldIgnore(action) || action.filter?.endsWith('  ')) {
            this.closeAutocomplete(action.view);
            return true;
        }

        this.updateState(action);

        this.#filterText = action.filter?.trim().toLowerCase();
        const needToClose = this.filterActions();
        this.render();

        if (needToClose) {
            this.closeAutocomplete(action.view);
        }

        return true;
    }

    onArrow(action: AutocompleteAction): boolean {
        if (this.shouldIgnore(action)) {
            closeAutocomplete(action.view);
            return true;
        }

        this.updateState(action);

        if (!this.#filteredActionsCarousel) return false;

        switch (action.kind) {
            case AutocompleteActionKind.up: {
                this.#filteredActionsCarousel.prev();
                break;
            }
            case AutocompleteActionKind.down: {
                this.#filteredActionsCarousel.next();
                break;
            }
            default:
                return false;
        }

        this.render();

        return true;
    }

    onEnter(action: AutocompleteAction): boolean {
        if (this.shouldIgnore(action)) {
            closeAutocomplete(action.view);
            return true;
        }

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

    private shouldIgnore(action: AutocompleteAction): boolean {
        const parentType = action.view.state.doc.resolve(action.range.from).parent.type;
        return (
            parentType.spec.commandMenu === false || this.#nodesIgnoreList.includes(parentType.name)
        );
    }

    private select() {
        if (!this.#view || !this.#range) return;

        const action = this.#filteredActionsCarousel?.currentItem;
        if (!action) return;

        const view = this.#view;
        const range = this.#range;

        view.dispatch(view.state.tr.deleteRange(range.from, range.to).scrollIntoView());
        action.exec(this.#actionStorage);
        view.focus();

        logger.action({mode: 'wysiwyg', source: 'command-menu', action: action.id});
    }

    private filterActions(): boolean {
        const currentItem = this.#filteredActionsCarousel?.currentItem;
        const inputText = this.#filterText;

        const enabledActions = this.#actions.filter((action) =>
            action.isEnable(this.#actionStorage),
        );

        let filteredActions = enabledActions;
        let needToClose = false;

        if (inputText) {
            filteredActions = filterActions(enabledActions, inputText);
            needToClose = !filteredActions.length && needToHide(enabledActions, inputText);
        }

        this.#filteredActionsCarousel = new ArrayCarousel(filteredActions);

        if (currentItem) {
            const newIndex = this.#filteredActionsCarousel.array.findIndex(
                (item) => item === currentItem,
            );
            if (newIndex !== -1) {
                this.#filteredActionsCarousel.currentIndex = newIndex;
            }
        }

        return needToClose;
    }

    private render() {
        this.findAnchor();
        const viewItems = this.#filteredActionsCarousel?.array ?? [];
        this.#menuProps = {
            anchor: this.#anchor,
            currentIndex: this.#filteredActionsCarousel?.currentIndex,
            items: viewItems,
            onClick: this.onItemClick,
            onEscapeKeyDown: this.#popupCloser?.popupEscapeKeyHandler,
            onOutsideClick: this.#popupCloser?.popupOutsideClickHandler,
        };
        this.#menuRenderItem = this.#menuRenderItem ?? this.createMenuRenderItem();
        this.#menuRenderItem.rerender();
    }

    private onItemClick = (index: number) => {
        if (this.#filteredActionsCarousel) {
            this.#filteredActionsCarousel.currentIndex = index;
            this.select();
        }
        this.#view?.focus();
    };

    private updateState({view, range}: AutocompleteAction) {
        this.#view = view;
        this.#range = range;
    }

    private clear() {
        this.#view = undefined;
        this.#range = undefined;
        this.#anchor = undefined;
        this.#filterText = undefined;
        this.#filteredActionsCarousel = undefined;
        this.#popupCloser?.cancelTimer();
        this.#popupCloser = undefined;
        this.#menuProps = undefined;
        this.#menuRenderItem?.remove();
        this.#menuRenderItem = undefined;
    }

    private createMenuRenderItem(): RendererItem {
        return getReactRendererFromState(this.#view!.state).createItem('command_menu', () =>
            this.#menuProps ? render(this.#menuProps) : null,
        );
    }

    private findAnchor() {
        this.#anchor = findDecoElem(this.#view?.dom);
    }
}

function filterActions(actions: readonly CommandAction[], text: string): CommandAction[] {
    return actions.filter(
        (action) =>
            action.id.toLowerCase().includes(text) ||
            (isFunction(action.title) ? action.title() : action.title).toLowerCase().includes(text),
    );
}

const CHARS_TO_HIDE = 4;
function needToHide(actions: readonly CommandAction[], text: string): boolean {
    let iter = 1;
    do {
        const prevInput = text.slice(0, text.length - iter);
        const prevActions = filterActions(actions, prevInput);
        if (prevActions.length) break;
        iter++;
    } while (iter < text.length && iter < CHARS_TO_HIDE);
    return iter >= CHARS_TO_HIDE;
}
