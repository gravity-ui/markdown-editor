import {useState} from 'react';

import {flushSync} from 'react-dom';

import {Playground} from './Playground.helpers';

export function UrlSyncPlayground() {
    const [syncMarkupToUrl, setSyncMarkupToUrl] = useState(true);

    return (
        <>
            <Playground initial="some text" syncMarkupToUrl={syncMarkupToUrl} />
            <button
                type="button"
                onClick={() => flushSync(() => window.mdEditor?.replace('pending text'))}
            >
                Replace markup
            </button>
            <button type="button" onClick={() => flushSync(() => setSyncMarkupToUrl(false))}>
                Disable URL synchronization
            </button>
        </>
    );
}
