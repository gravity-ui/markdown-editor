import {escapeQuoted} from '@gravity-ui/markdown-editor/_/markdown-utils/index.js';

export const LINE_BREAK = /\s*[\r\n]\s*/g;

export const singleLine = (text: string) => text.replace(LINE_BREAK, ' ');

/** The attributes of a directive on one line: `{name="value"}`, or empty without attributes. */
export function directiveAttrs(values: Record<string, string>): string {
    const attrs = Object.entries(values).map(
        ([name, value]) => `${name}="${escapeQuoted(singleLine(value))}"`,
    );
    return attrs.length ? `{${attrs.join(' ')}}` : '';
}
