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

    it.each(['unmounts', 'changes selector'])(
        'should keep the iframe document when a slot unmounts and its waiting replacement %s',
        (change) => {
            function Extensions() {
                const [active, setActive] = useState(true);
                return (
                    <>
                        <button onClick={() => setActive(false)}>Remove</button>
                        {active && (
                            <ViewerTargets selector="section">{() => 'Action'}</ViewerTargets>
                        )}
                        {(active || change === 'changes selector') && (
                            <ViewerTargets selector={active ? 'section' : 'aside'} mode="replace">
                                {() => 'Replacement'}
                            </ViewerTargets>
                        )}
                    </>
                );
            }
            act(() =>
                root.render(
                    <MarkdownViewer html="<section><iframe></iframe></section><aside></aside>">
                        <Extensions />
                    </MarkdownViewer>,
                ),
            );
            const frame = container.querySelector('iframe');
            const original = frame?.contentDocument;
            const button = container.querySelector('button');
            assert(original && button);

            act(() => button.click());
            expect(frame.contentDocument?.isSameNode(original)).toBe(true);
            expect(container.querySelector('aside')?.textContent).toBe(
                change === 'changes selector' ? 'Replacement' : '',
            );
        },
    );

    it.each(['update', 'unmount'])(
        'should discard a replaced fallback without reconnecting it on viewer %s',
        (change) => {
            const connected = vi.fn();
            const tag = `test-fallback-${change}`;
            customElements.define(
                tag,
                class extends HTMLElement {
                    connectedCallback() {
                        connected();
                    }
                },
            );
            act(() =>
                root.render(
                    <MarkdownViewer html={`<section><${tag}></${tag}></section>`}>
                        <ViewerTargets selector="section" mode="replace">
                            {() => 'Replacement'}
                        </ViewerTargets>
                    </MarkdownViewer>,
                ),
            );
            expect(connected).toHaveBeenCalledOnce();
            connected.mockClear();

            act(() => root.render(change === 'update' ? <MarkdownViewer html="Next" /> : null));
            expect(connected).not.toHaveBeenCalled();
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

    it.each([
        {change: 'a new host ID', nextId: 'b'},
        {change: 'the same host ID', nextId: 'a'},
    ])('should use hosts from the current HTML when data changes with $change', ({nextId}) => {
        function render(id: string, label: string) {
            const labels = new Map([[id, label]]);
            act(() =>
                root.render(
                    <MarkdownViewer html={`<h2 id="${id}" data-label="${label}">Title</h2>`}>
                        <ViewerTargets selector="h2[id]">
                            {(host) => {
                                const currentLabel = labels.get(host.id);
                                assert(currentLabel);
                                expect(host.dataset.label).toBe(currentLabel);
                                return <button>{currentLabel}</button>;
                            }}
                        </ViewerTargets>
                    </MarkdownViewer>,
                ),
            );
        }

        render('a', 'First');
        render(nextId, 'Second');

        expect(container.querySelector('h2 button')?.textContent).toBe('Second');
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

    it('should preserve append slot state after Suspense shows its fallback', () => {
        const pending = new Promise<void>(() => undefined);
        function Wait(): never {
            throw pending;
        }
        function render(suspend: boolean) {
            act(() =>
                root.render(
                    <MarkdownViewer html="<h2>Title</h2>">
                        <Suspense fallback="Loading">
                            <ViewerTargets selector="h2">
                                {() => <Counter label="Count" />}
                            </ViewerTargets>
                            {suspend && <Wait />}
                        </Suspense>
                    </MarkdownViewer>,
                ),
            );
        }

        render(false);
        act(() => container.querySelector('button')?.click());
        render(true);
        expect(container.textContent).toContain('Loading');
        render(false);
        expect(container.querySelector('button')?.textContent).toBe('Count: 1');
    });

    it('should restore the original child when a hidden viewer resumes without its replacement', () => {
        const pending = new Promise<void>(() => undefined);
        function Wait(): never {
            throw pending;
        }
        function render(hidden: boolean, replace: boolean) {
            act(() =>
                root.render(
                    <Suspense fallback="Loading">
                        <MarkdownViewer html="<section><i>Original</i></section>">
                            {replace && (
                                <ViewerTargets selector="section" mode="replace">
                                    {() => 'Active'}
                                </ViewerTargets>
                            )}
                        </MarkdownViewer>
                        {hidden && <Wait />}
                    </Suspense>,
                ),
            );
        }

        render(false, false);
        const original = container.querySelector('i');
        assert(original);
        render(false, true);
        render(true, true);
        expect(container.textContent).toContain('Loading');
        render(true, false);
        render(false, false);
        expect(container.querySelector('i')).toBe(original);
    });

    it('should show the outer Suspense fallback until a portal child is ready', async () => {
        let finish!: () => void;
        const pending = new Promise<void>((resolve) => {
            finish = resolve;
        });
        let ready = false;
        function Child() {
            if (!ready) throw pending;
            return <button>Action</button>;
        }

        act(() =>
            root.render(
                <MarkdownViewer html="<p>Text</p>">
                    <Suspense fallback="Loading">
                        <ViewerTargets selector="p">{() => <Child />}</ViewerTargets>
                    </Suspense>
                </MarkdownViewer>,
            ),
        );
        expect(container.textContent).toContain('Loading');

        await act(async () => {
            ready = true;
            finish();
            await pending;
        });
        expect(container.textContent).toBe('TextAction');
    });

    it.each([
        ['append', 'section'],
        ['append', 'p'],
        ['replace', 'section'],
        ['replace', 'p'],
    ] as const)(
        'should keep a suspended %s slot inactive while a replacement owns %s',
        (mode, selector) => {
            const pending = new Promise<void>(() => undefined);
            const layout = vi.fn();
            function Wait(): never {
                throw pending;
            }
            function Action() {
                useLayoutEffect(layout, []);
                return <button>Action</button>;
            }
            const children = vi.fn(() => <Action />);
            function render(suspend: boolean, replace = true) {
                act(() =>
                    root.render(
                        <MarkdownViewer html="<section><p>Text</p></section>">
                            <Suspense fallback="Loading">
                                <ViewerTargets selector="p" mode={mode}>
                                    {children}
                                </ViewerTargets>
                                {suspend && <Wait />}
                            </Suspense>
                            {replace && (
                                <ViewerTargets mode="replace" selector={selector}>
                                    {() => 'Replacement'}
                                </ViewerTargets>
                            )}
                        </MarkdownViewer>,
                    ),
                );
            }

            render(false);
            expect(container.querySelector('button')?.textContent).toBe('Action');
            render(true);
            expect(container.textContent).toContain('Replacement');
            children.mockClear();
            layout.mockClear();

            render(false);
            expect(children).not.toHaveBeenCalled();
            expect(layout).not.toHaveBeenCalled();

            render(false, false);
            expect(container.querySelector('button')?.textContent).toBe('Action');
            expect(layout).toHaveBeenCalledOnce();
        },
    );

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
