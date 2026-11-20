export const LINE_BREAK = /\s*[\r\n]\s*/g;

export const singleLine = (text: string) => text.replace(LINE_BREAK, ' ');

export const escapeDirectiveLabel = (text: string) => text.replace(/[\\[\]]/g, '\\$&');

export function directiveAttrs(values: Record<string, string>): string {
    const attrs = Object.entries(values).map(
        ([name, value]) => `${name}="${singleLine(value).replace(/[\\"]/g, '\\$&')}"`,
    );
    return attrs.length ? `{${attrs.join(' ')}}` : '';
}
