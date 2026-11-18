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
