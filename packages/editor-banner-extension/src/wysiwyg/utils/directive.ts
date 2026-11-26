export const escapeLabel = (label: string) => label.replace(/[\\[\]]/g, '\\$&');

// markdown-it decodes backslash escapes and character references in a quoted value.
export const escapeQuoted = (value: string) =>
    value.replace(/[\\"]/g, '\\$&').replace(/&(?=[a-z#][a-z0-9]{1,31};)/gi, '&amp;');

export const LINE_BREAK = /\s*[\r\n]\s*/g;

export const singleLine = (text: string) => text.replace(LINE_BREAK, ' ');

export function directiveAttrs(values: Record<string, string>): string {
    const attrs = Object.entries(values).map(
        ([name, value]) => `${name}="${escapeQuoted(singleLine(value))}"`,
    );
    return attrs.length ? `{${attrs.join(' ')}}` : '';
}
