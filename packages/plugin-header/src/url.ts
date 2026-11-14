/** Accepts `http:`, `https:`, `blob:` and relative addresses. */
export function safeImageUrl(raw: string): string | null {
    const value = raw.trim();
    if (!value || [...value].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))
        return null;
    if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^(https?|blob):/i.test(value)) return null;
    return value;
}

// The style parser of the sanitizer splits values at `;` outside parentheses and cuts `/*` comments.
const percentEncode = (char: string) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`;

export function toCssUrl(raw: string): string | null {
    const value = safeImageUrl(raw);
    return value && `url("${value.replace(/["'()*\\ ]/g, percentEncode)}")`;
}
