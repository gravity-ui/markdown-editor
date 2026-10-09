import {parseMarkers} from './utils';

/**
 * Reindents pasted text based on the current line's markers
 */
export function smartReindent(pastedText: string, currentLineText: string): string {
    // If current line is empty, return pasted text as is
    if (currentLineText.length === 0) {
        return pastedText;
    }

    // Get markers from current line
    const markers = parseMarkers(currentLineText);

    // If no markers found, return pasted text as is
    if (markers.length === 0) {
        return pastedText;
    }

    // Create indentation for subsequent lines by replacing list markers with spaces
    const subsequentIndent = markers
        .map((marker) => {
            if (marker.match(/^\d{1,6}\. |-|\*|\+/)) {
                return ' '.repeat(marker.length);
            }
            return marker;
        })
        .join('');

    // Split and process the pasted text
    const lines = pastedText.split('\n');

    const reindentedText = lines
        .map((line, index) => {
            // First line doesn't need indentation
            if (index === 0) {
                return line;
            }

            // Add indentation to all subsequent lines, including empty ones
            return subsequentIndent + line;
        })
        .join('\n');

    return reindentedText;
}
