import type {Options, Trigger} from 'prosemirror-autocomplete';

export type {
    FromTo,
    AutocompleteAction,
    AutocompleteState,
    Trigger as AutocompleteTrigger,
} from 'prosemirror-autocomplete';

export {ActionKind as AutocompleteActionKind} from 'prosemirror-autocomplete';

export interface AutocompleteHandler extends Pick<
    Options,
    'onArrow' | 'onClose' | 'onEnter' | 'onFilter' | 'onOpen'
> {
    onDestroy?: () => void;
}

export type AutocompleteItem = {trigger: Trigger; handler: AutocompleteHandler};
