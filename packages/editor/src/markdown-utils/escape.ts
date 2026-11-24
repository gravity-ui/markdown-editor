// markdown-it decodes backslash escapes and character references in a quoted value.
export function escapeQuoted(value: string): string {
    return value.replace(/[\\"]/g, '\\$&').replace(/&(?=[a-z#][a-z0-9]{1,31};)/gi, '&amp;');
}
