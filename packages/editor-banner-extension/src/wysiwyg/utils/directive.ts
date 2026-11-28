export const escapeLabel = (label: string) => label.replace(/[\\[\]]/g, '\\$&');

export const encodeDirectiveText = (value: string) =>
    value
        .replace(/&(?=[a-z#][a-z0-9]{1,31};)/gi, '&amp;')
        .replace(/\r/g, '&#13;')
        .replace(/\n/g, '&#10;');

export const escapeQuoted = (value: string) => encodeDirectiveText(value.replace(/[\\"]/g, '\\$&'));

export const LINE_BREAK = /\s*[\r\n]\s*/g;

export const singleLine = (text: string) => text.replace(LINE_BREAK, ' ');

export function directiveAttrs(values: Record<string, string>): string {
    const attrs = Object.entries(values).map(([name, value]) => `${name}="${escapeQuoted(value)}"`);
    return attrs.length ? `{${attrs.join(' ')}}` : '';
}
