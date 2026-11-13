import ts from 'typescript';

/** Removes empty lines at both ends. */
function trimEmptyLines(lines) {
    const first = lines.findIndex((line) => line !== '');
    const last = lines.findLastIndex((line) => line !== '');

    return first === -1 ? [] : lines.slice(first, last + 1);
}

/** Reads the lines of a JSDoc comment without the comment markers. */
function commentLines(doc) {
    const body = doc
        .getText()
        .replace(/^\/\*\*/, '')
        .replace(/\*\/$/, '');
    const lines = body.split('\n').map((line) => line.replace(/^\s*(\* ?)?/, '').trimEnd());

    return trimEmptyLines(lines);
}

/** Reads the JSDoc nearest to a declaration as written; tag lines follow the text without an empty line. */
export function jsDocLines(declaration) {
    const doc = ts.getJSDocCommentsAndTags(declaration).filter(ts.isJSDoc).at(-1);
    if (!doc) return [];

    const lines = commentLines(doc);

    return lines.filter((line, position) => line !== '' || !lines[position + 1]?.startsWith('@'));
}

/** Renders a list item with a signature and its JSDoc, continuation lines indented by two spaces. */
export function documentedItem(signature, docLines) {
    const [first, ...rest] = docLines;
    const head = first === undefined ? `- \`${signature}\`` : `- \`${signature}\` — ${first}`;

    return [head, ...rest.map((line) => `  ${line}`)];
}
