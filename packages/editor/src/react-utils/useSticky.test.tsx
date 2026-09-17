import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useSticky} from './useSticky';

describe('useSticky', () => {
    let container: HTMLDivElement;
    let element: HTMLDivElement;
    let root: Root;
    let top: number;

    function Probe() {
        const sticky = useSticky({current: element});
        return <output>{String(sticky)}</output>;
    }

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        vi.useFakeTimers();
        container = document.createElement('div');
        element = document.createElement('div');
        element.style.top = '8px';
        top = 100;
        vi.spyOn(element, 'getBoundingClientRect').mockImplementation(() => new DOMRect(0, top));
        document.body.append(container, element);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        element.remove();
        vi.restoreAllMocks();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it.each([
        {offset: '8px', position: 100, sticky: false},
        {offset: '8px', position: 8, sticky: true},
        {offset: '8.5px', position: 8.5, sticky: true},
        {offset: '8px', position: 8.015625, sticky: true},
        {offset: '8.75px', position: 9.25, sticky: true},
        {offset: '8.5px', position: 9.51, sticky: false},
        {offset: '-8.5px', position: -8.5, sticky: true},
    ])('reports $sticky for top=$position and offset=$offset', ({offset, position, sticky}) => {
        element.style.top = offset;
        top = position;

        act(() => root.render(<Probe />));

        expect(container.textContent).toBe(String(sticky));
    });

    it('activates on scroll and deactivates when scrolled back above the sticky boundary', () => {
        act(() => root.render(<Probe />));
        expect(container.textContent).toBe('false');

        act(() => {
            top = 8.015625;
            window.dispatchEvent(new Event('scroll'));
            vi.runOnlyPendingTimers();
        });
        expect(container.textContent).toBe('true');

        act(() => {
            top = 100;
            window.dispatchEvent(new Event('scroll'));
            vi.runOnlyPendingTimers();
        });
        expect(container.textContent).toBe('false');
    });

    it('rereads the fractional offset after a resize', () => {
        top = 72.5;
        act(() => root.render(<Probe />));
        expect(container.textContent).toBe('false');

        act(() => {
            element.style.top = '72.5px';
            window.dispatchEvent(new Event('resize'));
            vi.runOnlyPendingTimers();
        });

        expect(container.textContent).toBe('true');
    });
});
