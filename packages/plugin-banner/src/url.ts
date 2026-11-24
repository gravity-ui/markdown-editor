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

const hasControlChars = (value: string) =>
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);

/** The address of an image: `http:`, `https:`, `blob:` or relative; an unsafe address is `null`. */
export function safeImageUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || hasControlChars(value)) return null;
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^(https?|blob):/i.test(value)) return null;
    return value;
}

export function toCssUrl(value: string): string {
    // CSS escapes preserve the URL and hide parentheses and comment delimiters from the style sanitizer.
    const escaped = value.replace(/["'()*\\]/g, (char) => `\\${char.charCodeAt(0).toString(16)} `);
    return `url("${escaped}")`;
}
