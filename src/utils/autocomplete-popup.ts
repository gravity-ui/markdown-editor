import type {PopupProps} from '@gravity-ui/uikit';
import type {EditorView} from 'prosemirror-view';

import {closeAutocomplete} from '../extensions/behavior/Autocomplete';

export type AutocompletePopupProps = Pick<
    PopupProps,
    'onOutsideClick' | 'onEscapeKeyDown' | 'onEnterKeyDown'
> & {anchor?: Element | null};

export class AutocompletePopupCloser {
    readonly #view: EditorView;
    #timer?: ReturnType<typeof setTimeout>;

    constructor(view: EditorView) {
        this.#view = view;
    }

    popupEscapeKeyHandler: NonNullable<PopupProps['onEscapeKeyDown']> = () => {
        this.closeAutocomplete();
    };

    popupOutsideClickHandler: NonNullable<PopupProps['onOutsideClick']> = () => {
        if (!this.#view.hasFocus()) {
            this.#timer = setTimeout(() => {
                this.#timer = undefined;
                if (!this.#view.hasFocus()) {
                    this.closeAutocomplete();
                }
            }, 20);
        }
    };

    closeAutocomplete() {
        closeAutocomplete(this.#view);
    }

    cancelTimer() {
        if (this.#timer !== undefined) {
            clearTimeout(this.#timer);
            this.#timer = undefined;
        }
    }
}
