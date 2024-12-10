import {Completion, CompletionContext, snippet} from '@codemirror/autocomplete';

import {capitalize} from '../../../lodash';
import {DirectiveSyntaxFacet} from '../directive-facet';

export type YfmNoteType = 'info' | 'tip' | 'warning' | 'alert';
export const yfmNoteTypes: readonly YfmNoteType[] = ['info', 'tip', 'warning', 'alert'];
export const yfmNoteSnippetTemplate = (type: YfmNoteType) =>
    `{% note ${type} %}\n\n#{}\n\n{% endnote %}\n\n` as const;
export const yfmNoteSnippets: Record<YfmNoteType, ReturnType<typeof snippet>> = {
    info: snippet(yfmNoteSnippetTemplate('info')),
    tip: snippet(yfmNoteSnippetTemplate('tip')),
    warning: snippet(yfmNoteSnippetTemplate('warning')),
    alert: snippet(yfmNoteSnippetTemplate('alert')),
};

export const yfmCutSnippetTemplate = '{% cut "#{title}" %}\n\n#{}\n\n{% endcut %}\n\n';
export const yfmCutSnippet = snippet(yfmCutSnippetTemplate);

export const yfmCutDirectiveSnippetTemplate = ':::cut [#{title}]\n#{}\n:::\n\n';
export const yfmCutDirectiveSnippet = snippet(yfmCutDirectiveSnippetTemplate);

export const directiveAutocomplete = {
    autocomplete: (context: CompletionContext) => {
        const directiveContext = context.state.facet(DirectiveSyntaxFacet);

        // TODO: add more actions and re-enable
        // let word = context.matchBefore(/\/.*/);
        // if (word) {
        //     return {
        //         from: word.from,
        //         options: [
        //             ...yfmNoteTypes.map<Completion>((type, index) => ({
        //                 label: `/yfm note ${type}`,
        //                 displayLabel: `YFM Note ${capitalize(type)}`,
        //                 type: 'text',
        //                 apply: yfmNoteSnippets[type],
        //                 boost: -index,
        //             })),
        //             {
        //                 label: '/yfm cut',
        //                 displayLabel: 'YFM Cut',
        //                 type: 'text',
        //                 apply: directiveFacet.shouldInsertDirectiveMarkup('yfmCut')
        //                      ? yfmCutDirectiveSnippet
        //                      : yfmCutSnippet,
        //             },
        //         ],
        //     };
        // }

        const word = context.matchBefore(/^.*/);

        // if (allowEmptyRows && word?.text.startsWith('&')) {
        //     return {
        //         from: word.from,
        //         options: [
        //             {
        //                 label: '&nbsp;',
        //                 displayLabel: i18n('snippet.text'),
        //                 type: 'text',
        //                 apply: emptyRowSnippet,
        //             },
        //         ],
        //     };
        // }

        if (directiveContext.option !== 'only' && word?.text.startsWith('{%')) {
            return {
                from: word.from,
                options: [
                    ...yfmNoteTypes.map<Completion>((type, index) => ({
                        label: `{% note ${type}`,
                        displayLabel: capitalize(type),
                        type: 'text',
                        section: 'YFM Note',
                        apply: yfmNoteSnippets[type],
                        boost: -index,
                    })),
                    {
                        label: '{% cut',
                        displayLabel: 'YFM Cut',
                        type: 'text',
                        apply: directiveContext.shouldInsertDirectiveMarkup('yfmCut')
                            ? yfmCutDirectiveSnippet
                            : yfmCutSnippet,
                    },
                ],
            };
        }
        if (directiveContext.option !== 'disabled' && word?.text.startsWith(':')) {
            const options: Completion[] = [];

            if (directiveContext.valueFor('yfmCut') !== 'disabled') {
                options.push({
                    label: ':::cut',
                    displayLabel: 'YFM Cut',
                    type: 'text',
                    apply: yfmCutDirectiveSnippet,
                });
            }

            if (options.length) {
                return {from: word.from, options};
            }
        }
        return null;
    },
};
