/**
 * Parses markdown-style markers from the start of a line
 * Returns an array of markers found:
 * - '  ' for indentation
 * - '> ' for blockquotes
 * - '* ' or '- ' for list items
 *
 * Example inputs:
 *   "  * list" -> ['  ', '* ']
 *   "> quoted" -> ['> ']
 *   "    nested" -> ['  ', '  ']
 */
export function parseMarkers(text: string): string[] {
    const markers: string[] = [];
    let pos = 0;

    while (pos < text.length) {
        // Handle double-space indentation
        if (pos + 1 < text.length && text[pos] === ' ' && text[pos + 1] === ' ') {
            markers.push('  ');
            pos += 2;
            continue;
        }

        // Handle block quotes and list markers
        if (text[pos] === '>' || text[pos] === '-' || text[pos] === '*') {
            if (pos + 1 < text.length && text[pos + 1] === ' ') {
                markers.push(text[pos] + ' ');
                pos += 2;
                continue;
            }
        }

        break;
    }

    return markers;
}
