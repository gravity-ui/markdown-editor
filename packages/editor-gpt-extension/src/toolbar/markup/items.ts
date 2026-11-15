import type {EditorView} from '@codemirror/view';

import {showMarkupGpt} from '../../markup/commands/gpt';

export const gptItemMarkup = {
    exec: (editor: {cm: EditorView}) => showMarkupGpt(editor.cm),
    isActive: () => false,
    isEnable: () => true,
};
