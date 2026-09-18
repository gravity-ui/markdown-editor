import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useSticky} from './useSticky';

describe('useSticky', () => {
    let container: HTMLDivElement;
    let element: HTMLDivElement;
    let root: Root;
    let elementTop: number;

    function Probe() {
        return <output>{String(useSticky({current: element}))}</output>;
    }

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        vi.useFakeTimers();
        container = document.createElement('div');
        element = document.createElement('div');
        element.style.top = '8px';
        elementTop = 100;
        vi.spyOn(element, 'getBoundingClientRect').mockImplementation(
            () => new DOMRect(0, elementTop),
        );
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
        {offset: '8px', top: 100, sticky: false},
        // A stuck element is laid out a subpixel below its own top at fractional zoom
        {offset: '8px', top: 8.015625, sticky: true},
        {offset: '8.5px', top: 8.5, sticky: true},
        // Past the tolerance the element is genuinely below the sticky boundary
        {offset: '8.5px', top: 9.51, sticky: false},
    ])('reports $sticky for top $top with offset $offset', ({offset, top, sticky}) => {
        element.style.top = offset;
        elementTop = top;

        act(() => root.render(<Probe />));

        expect(container.textContent).toBe(String(sticky));
    });

    it('toggles on scroll', () => {
        act(() => root.render(<Probe />));
        expect(container.textContent).toBe('false');

        act(() => {
            elementTop = 8.015625;
            window.dispatchEvent(new Event('scroll'));
            vi.runOnlyPendingTimers();
        });
        expect(container.textContent).toBe('true');

        act(() => {
            elementTop = 100;
            window.dispatchEvent(new Event('scroll'));
            vi.runOnlyPendingTimers();
        });
        expect(container.textContent).toBe('false');
    });
});
