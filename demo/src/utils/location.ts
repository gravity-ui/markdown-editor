import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from 'lz-string';

const QKEY = 'markup';
const COMPRESSED_PREFIX = 'lz:';

export function parseLocation() {
    try {
        const markup = new URLSearchParams(parent.location.search).get(QKEY);
        if (markup === null) return null;
        if (markup.startsWith(COMPRESSED_PREFIX)) {
            return (
                decompressFromEncodedURIComponent(markup.slice(COMPRESSED_PREFIX.length)) || null
            );
        }
        return fromBase64(markup);
    } catch (e) {
        console.error('[Parse Location] ' + e);
        return null;
    }
}

export function updateLocation(str: string) {
    try {
        const b64Markup = toBase64(str);
        const compressedMarkup = COMPRESSED_PREFIX + compressToEncodedURIComponent(str);
        const url = new URL(parent.location.toString());
        url.searchParams.set(
            QKEY,
            encodeURIComponent(compressedMarkup).length < encodeURIComponent(b64Markup).length
                ? compressedMarkup
                : b64Markup,
        );
        parent.history.replaceState(parent.history.state, '', url.toString());
    } catch (e) {
        console.error('[Update Location]' + e);
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
