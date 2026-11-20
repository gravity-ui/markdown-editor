import type MarkdownIt from 'markdown-it';

const hasControlChars = (value: string) =>
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);

export function safeImageUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || hasControlChars(value)) return null;
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^(https?|blob):/i.test(value)) return null;
    return value;
}

/** The address of a Markdown link; an unsafe address is empty. */
export function normalizeLinkUrl(
    md: Pick<MarkdownIt, 'normalizeLink' | 'validateLink'>,
    value: unknown,
): string {
    if (typeof value !== 'string' || !value.trim()) return '';
    const href = md.normalizeLink(value.trim());
    return md.validateLink(href) ? href : '';
}
