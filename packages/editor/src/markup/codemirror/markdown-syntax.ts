import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import {language} from '@codemirror/language';
import {Facet} from '@codemirror/state';
import type {MarkdownConfig} from '@lezer/markdown' with {'resolution-mode': 'import'};

import {FileExtension} from './syntax/file';
import {ImageSizeExtension} from './syntax/image-size';

/** Additional Markdown syntax supplied by CodeMirror extensions. */
export const markdownSyntax = Facet.define<MarkdownConfig>();

// Used when no base language is supplied, including standalone resource replacement.
// Explicit bases (such as yfmLang) already include these rules.
const defaultMarkdownLanguage = markdown({
    base: markdownLanguage,
    extensions: [ImageSizeExtension, FileExtension],
}).language;

export function extendedMarkdownLanguage(base = defaultMarkdownLanguage) {
    return language.compute([markdownSyntax], (state) => {
        const extensions = state.facet(markdownSyntax);
        return extensions.length ? markdown({base, extensions: [...extensions]}).language : base;
    });
}
