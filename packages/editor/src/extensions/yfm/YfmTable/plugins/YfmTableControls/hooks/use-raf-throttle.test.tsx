import {StrictMode, useEffect} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, expect, it, vi} from 'vitest';

import {useRafThrottle} from './use-raf-throttle';

let root: Root;

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    root = createRoot(document.createElement('div'));
});

afterEach(() => {
    act(() => root.unmount());
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

it('should run the scheduled update after StrictMode restarts effects', () => {
    const update = vi.fn();
    act(() =>
        root.render(
            <StrictMode>
                <Control update={update} />
            </StrictMode>,
        ),
    );
    act(() => vi.runOnlyPendingTimers());
    expect(update).toHaveBeenCalledTimes(1);
});

function Control({update}: {update: () => void}) {
    const schedule = useRafThrottle(update);
    useEffect(() => {
        schedule();
        schedule();
    }, [schedule]);
    return null;
}
