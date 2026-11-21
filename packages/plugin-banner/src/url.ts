import type MarkdownIt from 'markdown-it';

const hasControlChars = (value: string) =>
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);

export function safeImageUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || hasControlChars(value)) return null;
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^(https?|blob):/i.test(value)) return null;
    return value;
}

export const allowedImageUrl = (
    md: Pick<MarkdownIt, 'normalizeLink' | 'validateLink'>,
    value: string | undefined,
) => (value === undefined || md.validateLink(md.normalizeLink(value.trim())) ? value : '');

export function safeLinkUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || hasControlChars(value)) return null;
    return /^(vbscript|javascript|file|data):/i.test(value) ? null : value;
}

const percentEncode = (char: string) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`;

export function toCssUrl(raw: string): string | null {
    const value = safeImageUrl(raw);
    return value && `url("${value.replace(/["'()*\\ ]/g, percentEncode)}")`;
}
