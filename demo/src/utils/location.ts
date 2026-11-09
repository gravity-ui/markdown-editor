import {decodeMarkup, encodeMarkup} from '@markdown-editor/markup-url';

const QKEY = 'markup';

export function parseLocation() {
    try {
        const markup = new URLSearchParams(parent.location.search).get(QKEY);
        return markup === null ? null : decodeMarkup(markup);
    } catch (e) {
        console.error('[Parse Location] ' + e);
        return null;
    }
}

export function updateLocation(str: string) {
    try {
        const url = new URL(parent.location.toString());
        url.searchParams.set(QKEY, encodeMarkup(str));
        parent.history.replaceState(parent.history.state, '', url.toString());
    } catch (e) {
        console.error('[Update Location]' + e);
    }
}
