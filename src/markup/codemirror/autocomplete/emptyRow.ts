import {CompletionContext, CompletionResult, snippet} from '@codemirror/autocomplete';

import {i18n} from '../../../i18n/empty-row';

export const emptyRowSnippetTemplate = '&nbsp;\n\n';
export const emptyRowSnippet = snippet(emptyRowSnippetTemplate);

export const emptyRowAutocomplete = {
    autocomplete: (context: CompletionContext): CompletionResult | null => {
        const word = context.matchBefore(/^.*/);

        if (word?.text.startsWith('&')) {
            return {
                from: word.from,
                options: [
                    {
                        label: '&nbsp;',
                        displayLabel: i18n('snippet.text'),
                        type: 'text',
                        apply: emptyRowSnippet,
                    },
                ],
            };
        }

        return null;
    },
};
