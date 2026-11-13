export const NOT_FOUND = 'Not found';
export const NOT_RECOGNIZED = 'Not recognized';

/** Renders a heading with its body; an empty body becomes `Not recognized` for a registered item and `Not found` otherwise. */
export function section(heading, body, isRegistered = false) {
    const empty = isRegistered ? NOT_RECOGNIZED : NOT_FOUND;

    return [heading, '', ...(body.length > 0 ? body : [empty]), ''];
}

/** Renders values as a list of inline code items. */
export function codeList(values) {
    return values.map((value) => `- \`${value}\``);
}

/** Renders lines as a fenced TypeScript block. */
export function codeBlock(lines) {
    return ['```ts', ...lines, '```'];
}

/** Writes source text on one line for inline code. */
export function inlineText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

/** Removes the common indentation of continuation lines: the first line starts inside a source line. */
export function dedentText(text) {
    const [first, ...rest] = text.split('\n');
    const indents = rest.filter((line) => line.trim()).map((line) => line.match(/^ */)[0].length);
    const indent = indents.length > 0 ? Math.min(...indents) : 0;

    return [first, ...rest.map((line) => line.slice(indent))].join('\n');
}
