import type MarkdownIt from 'markdown-it';

const hasControlChars = (value: string) =>
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);

// The rule of `validateLink` in markdown-it.
const unsafeProtocol = /^(vbscript|javascript|file|data):/i;
const safeImageData = /^data:image\/(gif|png|jpeg|webp);/i;

export function safeLinkUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || hasControlChars(value)) return null;
    return unsafeProtocol.test(value) && !safeImageData.test(value) ? null : value;
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
