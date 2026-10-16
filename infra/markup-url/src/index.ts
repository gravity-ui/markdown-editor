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

function bytesToBase64(bytes: Uint8Array) {
    let binString = '';
    for (const byte of bytes) {
        binString += String.fromCharCode(byte);
    }
    return btoa(binString);
}

function toBase64(str: string) {
    return bytesToBase64(new TextEncoder().encode(str));
}

function base64ToBytes(base64: string) {
    const binString = atob(base64);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}

function fromBase64(str: string) {
    return new TextDecoder().decode(base64ToBytes(str));
}
