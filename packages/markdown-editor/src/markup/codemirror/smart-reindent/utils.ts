/**
 * Parses markdown-style markers from the start of a line
 * Returns an array of markers found:
 * - ' ' for indentation
 * - '> ' for blockquotes
 * - '* ' or '- ' for list items
 * - '1. ' for numbered lists
 *
 * Example inputs:
 *   "  * list" -> ['  ', '* ']
 *   "> quoted" -> ['> ']
 *   "    nested" -> ['  ', '  ']
 *   "1. list" -> ['1. ']
 */
export function parseMarkers(text: string): string[] {
    const markers: string[] = [];
    let pos = 0;

    while (pos < text.length) {
        // Handle code block (4 spaces)
        if (
            pos + 3 < text.length &&
            text[pos] === ' ' &&
            text[pos + 1] === ' ' &&
            text[pos + 2] === ' ' &&
            text[pos + 3] === ' '
        ) {
            markers.push('    ');
            pos += 4;
            continue;
        }

        // Handle numbered lists (1-6 digits followed by dot and space)
        if (/^\d{1,6}\. /.test(text.slice(pos))) {
            const match = text.slice(pos).match(/^(\d{1,6}\. )/);
            if (match) {
                markers.push(match[1]);
                pos += match[1].length;
                continue;
            }
        }

        // Handle block quotes and list markers
        if (text[pos] === '>' || text[pos] === '-' || text[pos] === '*' || text[pos] === '+') {
            if (pos + 1 < text.length && text[pos + 1] === ' ') {
                markers.push(text[pos] + ' ');
                pos += 2;
                continue;
            }
        }

        // Handle single space (last priority)
        if (text[pos] === ' ') {
            markers.push(' ');
            pos += 1;
            continue;
        }

        break;
    }

    return markers;
}
