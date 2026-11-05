import {StrictMode, Suspense, startTransition, useLayoutEffect, useRef, useState} from 'react';

import {type Root, createRoot, hydrateRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../tests/utils/act';
import {MarkdownViewer, ViewerTargets, useViewerEffect} from '../index';

describe('ViewerTargets lifecycle', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
    });

    it.each(['selector', 'html', 'extension', 'viewer'])(
        'should clean up portal children before removing their slot on %s removal',
        (removal) => {
            const cleanup = vi.fn();
            function Child({host}: {host: HTMLElement}) {
                const ref = useRef<HTMLButtonElement>(null);
                useLayoutEffect(() => {
                    const button = ref.current;
                    assert(button);
                    const slot = button.parentElement;
                    assert(slot);
                    return () => {
                        expect(button.parentElement).toBe(slot);
                        expect(slot.parentElement).toBe(host);
                        cleanup();
                    };
                }, [host]);
                return <button ref={ref}>Action</button>;
            }
            function view(selector = 'h2', html = '<h2>Title</h2>', extension = true) {
                return (
                    <MarkdownViewer html={html}>
                        {extension && (
                            <ViewerTargets selector={selector}>
                                {(host) => <Child host={host} />}
                            </ViewerTargets>
                        )}
                    </MarkdownViewer>
                );
            }
            act(() => root.render(view()));
            const slot = container.querySelector('[data-markdown-viewer-slot]');
            act(() => {
                if (removal === 'selector') root.render(view('h3'));
                if (removal === 'html') root.render(view('h2', '<p>Next</p>'));
                if (removal === 'extension') root.render(view('h2', '<h2>Title</h2>', false));
                if (removal === 'viewer') root.render(null);
            });
            expect(cleanup).toHaveBeenCalledTimes(1);
            expect(slot?.parentElement).toBeNull();
        },
    );

    it('should preserve extension state and remount a replaced host with the same ID', () => {
        function Extension() {
            const [count, setCount] = useState(0);
            return (
                <>
                    <button data-parent="" onClick={() => setCount(count + 1)}>
                        {count}
                    </button>
                    <ViewerTargets selector="h2[id]">
                        {(host) => <Counter label={host.id} />}
                    </ViewerTargets>
                </>
            );
        }
        function render(text: string) {
            act(() =>
                root.render(
                    <MarkdownViewer html={`<h2 id="title">${text}</h2>`}>
                        <Extension />
                    </MarkdownViewer>,
                ),
            );
        }
        render('A');
        act(() => {
            container.querySelector<HTMLButtonElement>('[data-parent]')?.click();
            container.querySelector<HTMLButtonElement>('h2 button')?.click();
        });
        const previous = container.querySelector('[data-markdown-viewer-slot]');
        expect(previous?.textContent).toBe('title: 1');
        render('B');
        expect(previous?.parentElement).toBeNull();
        expect(container.querySelector('[data-parent]')?.textContent).toBe('1');
        expect(container.querySelector('h2 button')?.textContent).toBe('title: 0');
        expect(container.querySelectorAll('[data-markdown-viewer-slot]')).toHaveLength(1);
    });

    it('should keep hosts and slots when only an effect dependency changes', () => {
        const setups: number[] = [];
        function Effect({value}: {value: number}) {
            useViewerEffect(() => {
                setups.push(value);
            }, [value]);
            return null;
        }
        function render(value: number) {
            act(() =>
                root.render(
                    <MarkdownViewer html='<h2 id="title">Title</h2>'>
                        <Effect value={value} />
                        <ViewerTargets selector="h2[id]">
                            {() => <Counter label="Count" />}
                        </ViewerTargets>
                    </MarkdownViewer>,
                ),
            );
        }
        render(1);
        const host = container.querySelector('h2');
        const slot = container.querySelector('[data-markdown-viewer-slot]');
        act(() => container.querySelector('button')?.click());
        render(2);
        expect(setups).toEqual([1, 2]);
        expect(container.querySelector('h2')).toBe(host);
        expect(container.querySelector('[data-markdown-viewer-slot]')).toBe(slot);
        expect(slot?.textContent).toBe('Count: 1');
    });

    it('should avoid duplicate slots in StrictMode and remove them on unmount', () => {
        act(() =>
            root.render(
                <StrictMode>
                    <MarkdownViewer html='<h2 id="title">Title</h2>'>
                        <ViewerTargets selector="h2[id]">
                            {() => <Counter label="Count" />}
                        </ViewerTargets>
                    </MarkdownViewer>
                </StrictMode>,
            ),
        );
        const slots = container.querySelectorAll('[data-markdown-viewer-slot]');
        expect(slots).toHaveLength(1);
        act(() => container.querySelector('button')?.click());
        expect(slots[0].textContent).toBe('Count: 1');
        act(() => root.render(null));
        expect(slots[0].parentElement).toBeNull();
    });

    it('should add portals after hydration without a mismatch', async () => {
        act(() => root.unmount());
        const children = () => <button>Action</button>;
        const view = (
            <MarkdownViewer html='<h2 id="title">Title</h2>'>
                <ViewerTargets selector="h2[id]">{children}</ViewerTargets>
            </MarkdownViewer>
        );
        const serverHTML = renderToString(view);
        container.innerHTML = serverHTML;
        const host = container.querySelector('h2');
        const error = vi.fn();
        await act(async () => {
            root = hydrateRoot(container, view, {onRecoverableError: error});
        });
        expect(error).not.toHaveBeenCalled();
        expect(container.querySelector('h2')).toBe(host);
        expect(host?.querySelector('button')?.textContent).toBe('Action');
    });

    it('should keep committed portals during an interrupted transition', async () => {
        const pending = new Promise<void>(() => undefined);
        function Wait({value}: {value: string}) {
            if (value === 'pending') throw pending;
            return null;
        }
        function view(value: string) {
            return (
                <Suspense fallback="Loading">
                    <MarkdownViewer html={`<h2 id="${value}">${value}</h2>`}>
                        <ViewerTargets selector="h2[id]">
                            {(host) => <Counter label={host.id} />}
                        </ViewerTargets>
                        <Wait value={value} />
                    </MarkdownViewer>
                </Suspense>
            );
        }
        act(() => root.render(view('A')));
        act(() => container.querySelector('button')?.click());
        const slot = container.querySelector('[data-markdown-viewer-slot]');
        await act(async () => {
            startTransition(() => root.render(view('pending')));
        });
        expect(container.querySelector('[data-markdown-viewer-slot]')).toBe(slot);
        expect(slot?.textContent).toBe('A: 1');
        act(() => root.render(view('B')));
        expect(slot?.parentElement).toBeNull();
        expect(container.querySelector('button')?.textContent).toBe('B: 0');
    });
});

function Counter({label}: {label: string}) {
    const [count, setCount] = useState(0);
    return (
        <button onClick={() => setCount(count + 1)}>
            {label}: {count}
        </button>
    );
}
