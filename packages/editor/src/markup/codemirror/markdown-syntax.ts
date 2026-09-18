import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import {language} from '@codemirror/language';
import {Facet} from '@codemirror/state';
import type {MarkdownConfig} from '@lezer/markdown' with {'resolution-mode': 'import'};

/** Additional Markdown syntax supplied by CodeMirror extensions. */
export const markdownSyntax = Facet.define<MarkdownConfig>();

export function extendedMarkdownLanguage(base = markdownLanguage) {
    return language.compute([markdownSyntax], (state) => {
        const extensions = state.facet(markdownSyntax);
        return extensions.length ? markdown({base, extensions: [...extensions]}).language : base;
    });
}
