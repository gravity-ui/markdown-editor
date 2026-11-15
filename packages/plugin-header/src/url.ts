const hasControlChars = (value: string) =>
    [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);

export function safeLinkUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || hasControlChars(value)) return null;
    return /^(vbscript|javascript|file|data):/i.test(value) ? null : value;
}
