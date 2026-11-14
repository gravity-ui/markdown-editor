// The write side of the directive syntax read by `@gravity-ui/markdown-plugin-header`.

/** The text of a directive label in `[…]`: brackets and backslashes are escaped. */
export const escapeDirectiveLabel = (text: string) => text.replace(/[\\[\]]/g, '\\$&');

/**
 * The attributes of a directive as `{name="value" …}`, with backslashes and quotes of the values
 * escaped; an empty string without attributes.
 */
export function directiveAttrs(values: Record<string, string>): string {
    const attrs = Object.entries(values).map(
        ([name, value]) => `${name}="${value.replace(/[\\"]/g, '\\$&')}"`,
    );
    return attrs.length ? `{${attrs.join(' ')}}` : '';
}
