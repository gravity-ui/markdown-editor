import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from 'lz-string';

const COMPRESSED_PREFIX = 'lz:';

export function encodeMarkup(markup: string): string {
    const base64 = toBase64(markup);
    const compressed = COMPRESSED_PREFIX + compressToEncodedURIComponent(markup);

    return encodeURIComponent(compressed).length < encodeURIComponent(base64).length
        ? compressed
        : base64;
}

export function decodeMarkup(value: string): string | null {
    try {
        if (value.startsWith(COMPRESSED_PREFIX)) {
            return decompressFromEncodedURIComponent(value.slice(COMPRESSED_PREFIX.length)) || null;
        }

        // A value without the prefix comes from a link created before compression.
        return fromBase64(value);
    } catch {
        return null;
    }
}

function toBase64(markup: string) {
    let binary = '';
    for (const byte of new TextEncoder().encode(markup)) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function fromBase64(value: string) {
    return new TextDecoder().decode(Uint8Array.from(atob(value), (char) => char.charCodeAt(0)));
}
