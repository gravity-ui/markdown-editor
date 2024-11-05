import {debounce} from '../../src/lodash';

const QKEY = 'markup';

export function parseLocation() {
    try {
        const b64Markup = new URLSearchParams(parent.location.search).get(QKEY);
        return b64Markup ? fromBase64(b64Markup) : null;
    } catch (e) {
        console.error('[Parse Location] ' + e);
        return null;
    }
}

export function updateLocation(str: string) {
    try {
        const b64Markup = toBase64(str);
        const url = new URL(parent.location.toString());
        url.searchParams.set(QKEY, b64Markup);
        parent.history.replaceState({}, '', url.toString());
    } catch (e) {
        console.error('[Update Location]' + e);
    }
}

export const debouncedUpdateLocation = debounce(updateLocation, 500);

function bytesToBase64(bytes: Uint8Array) {
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
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
