import {debounce} from '../src/lodash';

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
    const b64Markup = toBase64(str);
    const url = new URL(parent.location.toString());
    url.searchParams.set(QKEY, b64Markup);
    parent.history.replaceState({}, '', url.toString());
}

export const debouncedUpdateLocation = debounce(updateLocation, 500);

function toBase64(str: string) {
    return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64(str: string) {
    return decodeURIComponent(escape(atob(str)));
}
