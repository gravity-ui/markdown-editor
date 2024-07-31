import {Completion, CompletionSource, snippet} from '@codemirror/autocomplete';
import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import type {Extension} from '@codemirror/state';
import {Tag, tags} from '@lezer/highlight';
import type {DelimiterType, MarkdownConfig} from '@lezer/markdown';

import {capitalize} from '../../lodash';

export const customTags = {
    underline: Tag.define(),
    monospace: Tag.define(),
    marked: Tag.define(),
};

function mdInlineFactory({
    name,
    char,
    tag,
}: {
    name: string;
    char: number;
    tag: Tag;
}): MarkdownConfig {
    const NodeName = name;
    const MarkName = `${name}Mark`;
    const Delim: DelimiterType = {resolve: NodeName, mark: MarkName};
    return {
        defineNodes: [
            {name: NodeName, style: {[`${NodeName}/...`]: tag}},
            {name: MarkName, style: tags.processingInstruction},
        ],
        parseInline: [
            {
                name,
                parse(cx, next, pos) {
                    if (next !== char || cx.char(pos + 1) !== char || cx.char(pos + 2) === char)
                        return -1;

                    return cx.addDelimiter(Delim, pos, pos + 2, true, true);
                },
                after: 'Emphasis',
            },
        ],
    };
}

const UnderlineExtension = mdInlineFactory({
    name: 'Underline',
    char: '+'.charCodeAt(0),
    tag: customTags.underline,
});

const MonospaceExtension = mdInlineFactory({
    name: 'Monospace',
    char: '#'.charCodeAt(0),
    tag: customTags.monospace,
});

const MarkedExtension = mdInlineFactory({
    name: 'Marked',
    char: '='.charCodeAt(0),
    tag: customTags.marked,
});

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

export interface LanguageData {
    autocomplete: CompletionSource;
    [key: string]: any;
}

export interface YfmLangOptions {
    languageData?: LanguageData[];
}

const baseAutocompletes: Autocomplete[] = [
    {
        autocomplete: (context) => {
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
            //                 apply: yfmCutSnippet,
            //             },
            //         ],
            //     };
            // }
            const word = context.matchBefore(/^.*/);
            if (word?.text.startsWith('{%')) {
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
                            apply: yfmCutSnippet,
                        },
                    ],
                };
            }
            return null;
        },
    },
];

const defaultOptions = {};
const defaultAutocompletes: Autocomplete[] = [];

export function yfmLang({languageData = []}: YfmLangOptions = {}): Extension {
    const mdSupport = markdown({
        // defaultCodeLanguage: markdownLanguage,
        base: markdownLanguage,
        addKeymap: true,
        completeHTMLTags: false,
        extensions: [UnderlineExtension, MonospaceExtension, MarkedExtension],
    });

    return [
        mdSupport,
        mdSupport.language.data.of(mdAutocomplete),
        languageData.map((item) => mdSupport.language.data.of(item)),
    ];
}
