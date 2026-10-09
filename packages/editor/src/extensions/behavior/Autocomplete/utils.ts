import {pluginKey} from 'prosemirror-autocomplete';

import type {EditorState} from '#pm/state';

import type {AutocompleteState} from './types';

export function getAutocompleteState(state: EditorState): AutocompleteState | null {
    return pluginKey.getState(state) || null;
}
