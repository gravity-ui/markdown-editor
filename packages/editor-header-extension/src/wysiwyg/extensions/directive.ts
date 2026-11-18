const LINE_BREAK = /\s*[\r\n]\s*/g;

const singleLine = (text: string) => text.replace(LINE_BREAK, ' ');

export function directiveAttrs(values: Record<string, string>): string {
    const attrs = Object.entries(values).map(
        ([name, value]) => `${name}="${singleLine(value).replace(/[\\"]/g, '\\$&')}"`,
    );
    return attrs.length ? `{${attrs.join(' ')}}` : '';
}
