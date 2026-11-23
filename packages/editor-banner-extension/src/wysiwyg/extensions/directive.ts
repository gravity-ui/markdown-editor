export const LINE_BREAK = /\s*[\r\n]\s*/g;

export const singleLine = (text: string) => text.replace(LINE_BREAK, ' ');

export const escapeDirectiveLabel = (text: string) => text.replace(/[\\[\]`]/g, '\\$&');

// The directive parser decodes character references and backslash escapes in attribute values.
const escapeAttr = (value: string) => value.replace(/&/g, '&amp;').replace(/[\\"]/g, '\\$&');

/** The attributes of a directive on one line: `{name="value"}`, or empty without attributes. */
export function directiveAttrs(values: Record<string, string>): string {
    const attrs = Object.entries(values).map(
        ([name, value]) => `${name}="${escapeAttr(singleLine(value))}"`,
    );
    return attrs.length ? `{${attrs.join(' ')}}` : '';
}
