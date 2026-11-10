import {type ReactNode, StrictMode, Suspense, startTransition, useState} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../tests/utils/act';
import {MarkdownViewer, type ViewerEffect, useViewerEffect} from '../index';

describe('MarkdownViewer lifecycle', () => {
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

    function render(children: ReactNode, html = '<p>A</p>') {
        act(() => root.render(<MarkdownViewer html={html}>{children}</MarkdownViewer>));
    }

    it('should cancel and clean up every run before replacing HTML', () => {
        const events: string[] = [];
        const signals: AbortSignal[] = [];

        function Extension({name}: {name: string}) {
            useViewerEffect(
                ({root: content, signal}) => {
                    signals.push(signal);
                    events.push(`setup ${name} ${content.textContent}`);
                    signal.addEventListener('abort', () => events.push(`abort ${name}`));
                    return () => {
                        expect(signals.every((item) => item.aborted)).toBe(true);
                        events.push(`cleanup ${name} ${content.textContent}`);
                    };
                },
                [name],
            );
            return null;
        }

        const extensions = (
            <>
                <Extension name="one" />
                <Extension name="two" />
            </>
        );

        render(extensions, '<p>A</p>');
        expect(events.slice(0, 2).sort()).toEqual(['setup one A', 'setup two A']);
        events.length = 0;
        render(extensions, '<p>B</p>');
        expect(events.slice(0, 2).sort()).toEqual(['abort one', 'abort two']);
        expect(events.slice(2, 4).sort()).toEqual(['cleanup one A', 'cleanup two A']);
        expect(events.slice(4).sort()).toEqual(['setup one B', 'setup two B']);
    });

    it('should restart only the changed dependency and preserve HTML nodes', () => {
        const events: string[] = [];
        const unchanged = vi.fn();
        const setup: ViewerEffect = ({signal}) => {
            events.push('setup');
            return () => events.push(`cleanup ${signal.aborted}`);
        };
        function children(value: number) {
            return (
                <>
                    <Effect setup={setup} value={value} />
                    <Effect setup={unchanged} />
                </>
            );
        }

        render(children(1));
        const host = container.querySelector('p');
        const slot = document.createElement('span');
        host?.append(slot);
        render(children(2));

        expect(events).toEqual(['setup', 'cleanup true', 'setup']);
        expect(unchanged).toHaveBeenCalledTimes(1);
        expect(container.querySelector('p')).toBe(host);
        expect(slot.parentElement).toBe(host);
    });

    it.each([
        {name: 'NaN stays NaN', previous: NaN, next: NaN, setups: 1, cleanups: 0},
        {name: 'zero changes to negative zero', previous: 0, next: -0, setups: 2, cleanups: 1},
    ])(
        'should compare dependencies with Object.is when $name',
        ({previous, next, setups, cleanups}) => {
            const cleanup = vi.fn();
            const setup = vi.fn(() => cleanup);

            render(<Effect setup={setup} value={previous} />);
            render(<Effect setup={setup} value={next} />);

            expect(setup).toHaveBeenCalledTimes(setups);
            expect(cleanup).toHaveBeenCalledTimes(cleanups);
        },
    );

    it('should run the latest setup once when HTML and dependencies change together', () => {
        const first = vi.fn();
        const second = vi.fn();
        render(<Effect setup={first} value={1} />);
        render(<Effect setup={second} value={2} />, '<p>B</p>');
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
        expect(second.mock.calls[0][0].root.textContent).toBe('B');
    });

    it('should keep a run for a new callback with the same dependencies', () => {
        const first = vi.fn();
        const latest = vi.fn();
        render(<Effect setup={first} />);
        render(<Effect setup={latest} />);
        expect(first).toHaveBeenCalledTimes(1);
        expect(latest).not.toHaveBeenCalled();
        render(<Effect setup={latest} />, '<p>B</p>');
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it('should preserve child state across HTML replacements', () => {
        function Counter() {
            const [count, setCount] = useState(0);
            return <button onClick={() => setCount(count + 1)}>{count}</button>;
        }
        render(<Counter />);
        act(() => container.querySelector('button')?.click());
        render(<Counter />, '<p>B</p>');
        expect(container.querySelector('button')?.textContent).toBe('1');
    });

    it('should restart an extension on its own state update', () => {
        const values: number[] = [];
        function Extension() {
            const [value, setValue] = useState(0);
            useViewerEffect(() => {
                values.push(value);
            }, [value]);
            return <button onClick={() => setValue(value + 1)}>Update</button>;
        }
        render(<Extension />);
        act(() => container.querySelector('button')?.click());
        expect(values).toEqual([0, 1]);
    });

    it('should cancel and clean up a removed extension once', () => {
        const cleanup = vi.fn();
        const setup: ViewerEffect =
            ({signal}) =>
            () => {
                expect(signal.aborted).toBe(true);
                cleanup();
            };
        render(<Effect setup={setup} />);
        render(null);
        render(null, '<p>B</p>');
        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should replay setup with a fresh signal in StrictMode and release it on unmount', () => {
        const runs: AbortSignal[] = [];
        const cleanup = vi.fn();
        const setup: ViewerEffect = ({signal}) => {
            runs.push(signal);
            return cleanup;
        };
        act(() =>
            root.render(
                <StrictMode>
                    <MarkdownViewer html="<p>A</p>">
                        <Effect setup={setup} />
                    </MarkdownViewer>
                </StrictMode>,
            ),
        );
        expect(runs).toHaveLength(2);
        expect(runs[0].aborted).toBe(true);
        expect(runs[1].aborted).toBe(false);
        expect(cleanup).toHaveBeenCalledTimes(1);
        act(() => root.render(null));
        expect(runs[1].aborted).toBe(true);
        expect(cleanup).toHaveBeenCalledTimes(2);
    });

    it('should isolate two viewers and remount only the changed document key', () => {
        const left = vi.fn();
        const right = vi.fn();
        function viewers(key: string) {
            act(() =>
                root.render(
                    <>
                        <MarkdownViewer key={key} html="<p>Left</p>">
                            <Effect setup={left} />
                        </MarkdownViewer>
                        <MarkdownViewer html="<p>Right</p>">
                            <Effect setup={right} />
                        </MarkdownViewer>
                    </>,
                ),
            );
        }
        viewers('first');
        const leftSignal = left.mock.calls[0][0].signal;
        viewers('second');
        expect(leftSignal.aborted).toBe(true);
        expect(left).toHaveBeenCalledTimes(2);
        expect(right).toHaveBeenCalledTimes(1);
        expect(left.mock.calls[1][0].root.textContent).toBe('Left');
        expect(right.mock.calls[0][0].root.textContent).toBe('Right');
    });

    it('should keep committed effects during an interrupted transition', async () => {
        const setups: string[] = [];
        const signals: AbortSignal[] = [];
        const pending = new Promise<void>(() => undefined);
        function Extension({value}: {value: string}) {
            useViewerEffect(
                ({root: content, signal}) => {
                    setups.push(`${content.textContent} ${value}`);
                    signals.push(signal);
                },
                [value],
            );
            if (value === 'pending') throw pending;
            return null;
        }
        function renderDocument(value: string) {
            return (
                <Suspense fallback="Loading">
                    <MarkdownViewer html={`<p>${value}</p>`}>
                        <Extension value={value} />
                    </MarkdownViewer>
                </Suspense>
            );
        }
        act(() => root.render(renderDocument('A')));
        await act(async () => {
            startTransition(() => root.render(renderDocument('pending')));
        });
        expect(signals[0].aborted).toBe(false);
        expect(container.querySelector('p')?.textContent).toBe('A');
        act(() => root.render(renderDocument('B')));
        expect(setups).toEqual(['A A', 'B B']);
        expect(signals[0].aborted).toBe(true);
    });
});

function Effect({setup, value = 0}: {setup: ViewerEffect; value?: number}) {
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Test callback identity separately.
    useViewerEffect(setup, [value]);
    return null;
}
