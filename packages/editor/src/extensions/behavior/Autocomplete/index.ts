import {
    autocomplete,
    openAutocomplete as openSuggestion,
    pluginKey,
} from 'prosemirror-autocomplete';
import {Plugin} from 'prosemirror-state';
import type {EditorView} from 'prosemirror-view';

import type {ExtensionAuto, ExtensionDeps} from '../../../core';
import {isFunction} from '../../../lodash';
import {TableCellSelection} from '../TableCellSelection';

import {MainHandler} from './handler';
import type {AutocompleteItem, AutocompleteTrigger} from './types';
import {getAutocompleteState} from './utils';

export {closeAutocomplete} from 'prosemirror-autocomplete';
export {getAutocompleteState} from './utils';
export const AutocompleteDecoClassName = 'autocomplete';

export function openAutocomplete(view: EditorView, trigger: string, filter?: string): void {
    if (view.state.selection instanceof TableCellSelection) return;
    openSuggestion(view, trigger, filter);
}

export type AutocompleteItemFn = (deps: ExtensionDeps) => AutocompleteItem;
export * from './types';

type Storage = {
    add(item: AutocompleteItem | AutocompleteItemFn): Storage;
};

/**
 * This extension is wrapper of _prosemirror-autocomplete_
 * You only need to use it once.
 * Don't add this extension many times with different options.
 * Don't import anything from the _prosemirror-autocomplete_ source package.
 * Everything you need is exported from this module.
 */
export const Autocomplete: ExtensionAuto = (builder) => {
    const storage = new Set<AutocompleteItem | AutocompleteItemFn>();
    builder.context.set('autocomplete', storage);

    builder.addPlugin((deps) => {
        const triggers: AutocompleteTrigger[] = [];
        const config: AutocompleteItem[] = [];
        for (const itemOrFn of storage) {
            const item: AutocompleteItem = isFunction(itemOrFn) ? itemOrFn(deps) : itemOrFn;
            triggers.push(item.trigger);
            config.push(item);
        }

        const handler = new MainHandler(config, builder.logger);
        const plugins = autocomplete({
            triggers,
            onOpen: handler.onOpen.bind(handler),
            onClose: handler.onClose.bind(handler),
            onFilter: handler.onFilter.bind(handler),
            onArrow: handler.onArrow.bind(handler),
            onEnter: handler.onEnter.bind(handler),
        });

        /**
         * BugFix: because _prosemirror-autocomplete_ does not handle the destruction of the view,
         * we have to handle it ourselves
         */
        return plugins.concat(
            new Plugin({
                appendTransaction(_transactions, _oldState, state) {
                    if (
                        state.selection instanceof TableCellSelection &&
                        getAutocompleteState(state)?.active
                    ) {
                        return state.tr.setMeta(pluginKey, {action: 'remove'});
                    }
                    return null;
                },
                view: () => ({
                    destroy: () => handler.onDestroy(),
                }),
            }),
        );
    }, builder.Priority.VeryHigh);
};

declare global {
    namespace WysiwygEditor {
        interface Context {
            autocomplete: Storage;
        }
    }
}
