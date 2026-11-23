import type MarkdownIt from 'markdown-it';

/** The address of a Markdown link; an unsafe address is empty. */
export function normalizeLinkUrl(
    md: Pick<MarkdownIt, 'normalizeLink' | 'validateLink'>,
    value: unknown,
): string {
    if (typeof value !== 'string' || !value.trim()) return '';
    const href = md.normalizeLink(value.trim());
    return md.validateLink(href) ? href : '';
}
