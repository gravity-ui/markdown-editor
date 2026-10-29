import {startCompletion} from '@codemirror/autocomplete';
import type {Command} from '@codemirror/view';

export const openEmojiSuggest: Command = (view) => {
    if (view.state.readOnly || !view.state.selection.main.empty) return false;

    view.dispatch({...view.state.replaceSelection(':'), scrollIntoView: true});
    return startCompletion(view);
};
