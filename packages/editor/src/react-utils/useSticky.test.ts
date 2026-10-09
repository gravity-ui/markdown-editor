import {createElement} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useSticky} from './useSticky';

describe('useSticky', () => {
    let host: HTMLElement;
    let container: HTMLElement;
    let element: HTMLElement;
    let root: Root;

    function rect(top: number): DOMRect {
        return {
            top,
            bottom: top + 40,
            left: 0,
            right: 100,
            width: 100,
            height: 40,
            x: 0,
            y: top,
            toJSON: () => ({}),
        };
    }

    function render(top = 8) {
        element.style.top = `${top}px`;
        const ref = {current: element};
        function Component() {
            const sticky = useSticky(ref);
            return createElement('span', null, String(sticky));
        }
        act(() => root.render(createElement(Component)));
    }

    function scroll(target: HTMLElement | Window = container) {
        act(() => {
            target.dispatchEvent(new Event('scroll'));
            vi.runAllTimers();
        });
    }

    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
            setTimeout(() => callback(0), 16),
        );
        vi.stubGlobal('cancelAnimationFrame', clearTimeout);
        host = document.createElement('div');
        container = document.createElement('div');
        element = document.createElement('div');
        document.body.append(host, container);
        container.append(element);
        vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(200));
        vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect(208));
        root = createRoot(host);
    });

    afterEach(() => {
        act(() => root.unmount());
        host.remove();
        container.remove();
        document.body.style.overflowY = '';
        document.documentElement.style.overflowY = '';
        document.documentElement.style.overflowX = '';
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it.each(['auto', 'scroll', 'hidden', 'overlay'])(
        'should detect sticky state with overflow-y %s',
        (overflowY) => {
            container.style.overflowY = overflowY;
            container.style.overflowX = 'hidden';
            render();
            expect(host.textContent).toBe('true');
        },
    );

    it('should account for the scroll container border', () => {
        container.style.overflowY = 'auto';
        Object.defineProperty(container, 'clientTop', {value: 3});
        vi.mocked(element.getBoundingClientRect).mockReturnValue(rect(211));
        render();
        expect(host.textContent).toBe('true');
    });

    it('should update sticky state as the container scrolls', () => {
        container.style.overflowY = 'auto';
        vi.mocked(element.getBoundingClientRect).mockReturnValue(rect(230));
        render();
        expect(host.textContent).toBe('false');
        vi.mocked(element.getBoundingClientRect).mockReturnValue(rect(208));
        scroll();
        expect(host.textContent).toBe('true');
        vi.mocked(element.getBoundingClientRect).mockReturnValue(rect(230));
        scroll();
        expect(host.textContent).toBe('false');
    });

    it('should use the nearest vertical scroll container', () => {
        container.style.overflowY = 'auto';
        const inner = document.createElement('div');
        inner.style.overflowY = 'scroll';
        vi.spyOn(inner, 'getBoundingClientRect').mockReturnValue(rect(100));
        container.append(inner);
        inner.append(element);
        render();
        expect(host.textContent).toBe('false');
    });

    it('should ignore ancestors with horizontal clip overflow', () => {
        container.style.overflowX = 'clip';
        container.style.overflowY = 'visible';
        render();
        expect(host.textContent).toBe('false');
    });

    it('should preserve fractional computed offsets', () => {
        vi.mocked(element.getBoundingClientRect).mockReturnValue(rect(8.5));
        render(8.5);
        expect(host.textContent).toBe('true');
    });

    it('should accept a zero computed offset', () => {
        vi.mocked(element.getBoundingClientRect).mockReturnValue(rect(0));
        render(0);
        expect(host.textContent).toBe('true');
    });

    it('should use the viewport when body overflow is propagated', () => {
        document.body.style.overflowY = 'auto';
        document.documentElement.style.overflowY = 'visible';
        document.documentElement.style.overflowX = 'visible';
        vi.spyOn(document.body, 'getBoundingClientRect').mockReturnValue(rect(-100));
        vi.mocked(element.getBoundingClientRect).mockReturnValue(rect(8));
        render();
        expect(host.textContent).toBe('true');
    });

    it('should cancel pending observations on unmount', () => {
        render();
        container.dispatchEvent(new Event('scroll'));
        expect(vi.getTimerCount()).toBe(1);
        act(() => root.unmount());
        expect(vi.getTimerCount()).toBe(0);
        root = createRoot(host);
    });
});
