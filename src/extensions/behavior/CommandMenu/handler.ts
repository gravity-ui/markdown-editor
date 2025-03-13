import type {EditorView} from 'prosemirror-view';

import type {ActionStorage} from '../../../core';
import {isFunction} from '../../../lodash';
import {type Logger2, globalLogger} from '../../../logger';
import {AutocompletePopupCloser} from '../../../utils/autocomplete-popup';
import {ArrayCarousel} from '../../../utils/carousel';
import {
    type AutocompleteAction,
    AutocompleteActionKind,
    type AutocompleteHandler,
    closeAutocomplete,
    getAutocompleteState,
} from '../Autocomplete';
import {type RendererItem, getReactRendererFromState} from '../ReactRenderer';

import {type CommandMenuComponentProps, render} from './component';
import type {CommandAction, Config} from './types';
import {findDecoElem} from './utils';

declare module 'prosemirror-model' {
    interface NodeSpec {
        commandMenu?: boolean;
    }
}

export type CommandHandlerParams = {
    logger: Logger2.ILogger;
    actions: Config;
    storage: ActionStorage;
    nodesIgnoreList?: readonly string[];
};

export class CommandHandler implements AutocompleteHandler {
    readonly #logger: Logger2.ILogger;
    readonly #actions: readonly CommandAction[];
    readonly #actionStorage: ActionStorage;
    readonly #nodesIgnoreList: readonly string[];
    #filteredActionsCarousel?: ArrayCarousel<CommandAction>;

    #view?: EditorView;
    #anchor: Element | null = null;
    #filterText?: string;
    #popupCloser?: AutocompletePopupCloser;

    #menuProps?: CommandMenuComponentProps;
    #menuRenderItem?: RendererItem;

    constructor({logger, actions, storage, nodesIgnoreList = []}: CommandHandlerParams) {
        this.#logger = logger;
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
        if (!this.#view) return;

        const action = this.#filteredActionsCarousel?.currentItem;
        if (!action) return;

        const autocompleteState = getAutocompleteState(this.#view.state);
        if (!autocompleteState || !autocompleteState.active) return;

        const view = this.#view;
        const {range} = autocompleteState;

        view.dispatch(view.state.tr.deleteRange(range.from, range.to).scrollIntoView());
        action.exec(this.#actionStorage);
        view.focus();

        globalLogger.action({mode: 'wysiwyg', source: 'command-menu', action: action.id});
        this.#logger.action({source: 'command-menu', action: action.id});
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
            anchorElement: this.#anchor,
            currentIndex: this.#filteredActionsCarousel?.currentIndex,
            items: viewItems,
            onItemClick: this.onItemClick,
            onOpenChange: this.#popupCloser?.popupOpenChangeHandler,
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

    private updateState({view}: AutocompleteAction) {
        this.#view = view;
    }

    private clear() {
        this.#view = undefined;
        this.#anchor = null;
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
