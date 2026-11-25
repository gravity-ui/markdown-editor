import type MarkdownIt from 'markdown-it';

export type LinkParser = Pick<MarkdownIt, 'normalizeLink' | 'validateLink'>;

/** The address of a Markdown link; an unsafe address is empty. */
export function normalizeLinkUrl(md: LinkParser, value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) return '';
    const href = md.normalizeLink(value.trim());
    return md.validateLink(href) ? href : '';
}

export function toCssUrl(value: string): string {
    // CSS escapes preserve the URL and hide parentheses and comment delimiters from the style sanitizer.
    const escaped = value.replace(/["'()*\\]/g, (char) => `\\${char.charCodeAt(0).toString(16)} `);
    return `url("${escaped}")`;
}
