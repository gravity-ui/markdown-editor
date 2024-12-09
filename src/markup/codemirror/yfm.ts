import {CompletionSource} from '@codemirror/autocomplete';
import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import type {Extension} from '@codemirror/state';
import {Tag, tags} from '@lezer/highlight';
import type {DelimiterType, MarkdownConfig} from '@lezer/markdown';

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

export interface LanguageData {
    autocomplete: CompletionSource;
    [key: string]: any;
}

export interface YfmLangOptions {
    languageData?: LanguageData[];
}

export function yfmLang({languageData = []}: YfmLangOptions = {}): Extension {
    const mdSupport = markdown({
        // defaultCodeLanguage: markdownLanguage,
        base: markdownLanguage,
        addKeymap: true,
        completeHTMLTags: false,
        extensions: [UnderlineExtension, MonospaceExtension, MarkedExtension],
    });

    return [mdSupport, languageData.map((item) => mdSupport.language.data.of(item))];
}
