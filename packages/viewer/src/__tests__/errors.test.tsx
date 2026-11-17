import {type Root, createRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../tests/utils/act';
import {ErrorBoundary} from '../../tests/utils/error-boundary';
import {MarkdownViewer, type ViewerEffect, useViewerEffect} from '../index';

describe('Viewer effect errors', () => {
    let root: Root;
    let container: HTMLDivElement;
    const expectedErrors = new Set<unknown>();

    function onError(event: ErrorEvent) {
        const errors = event.error instanceof AggregateError ? event.error.errors : [event.error];
        if (errors.length && errors.every((error) => expectedErrors.has(error))) {
            event.preventDefault();
        }
    }

    beforeEach(() => {
        container = document.createElement('div');
        root = createRoot(container);
        window.addEventListener('error', onError);
    });

    afterEach(() => {
        act(() => root.unmount());
        window.removeEventListener('error', onError);
        expectedErrors.clear();
        vi.restoreAllMocks();
    });

    it('should reject use outside a viewer', () => {
        expect(() => renderToString(<Effect setup={() => undefined} />)).toThrow(
            'useViewerEffect must be used inside MarkdownViewer',
        );
    });

    it.each([1, 2])(
        'should release every run and report %i cleanup errors during replacement',
        (errorCount) => {
            const failures = [
                new Error('First cleanup failed'),
                new Error('Second cleanup failed'),
            ].slice(0, errorCount);
            for (const failure of failures) expectedErrors.add(failure);
            const caught = vi.fn();
            const cleanups: string[] = [];
            const setups: string[] = [];
            const signals: AbortSignal[] = [];
            vi.spyOn(console, 'error').mockImplementation(() => undefined);

            function render(html: string) {
                act(() =>
                    root.render(
                        <ErrorBoundary onError={caught}>
                            <MarkdownViewer html={html}>
                                {[0, 1, 2].map((index) => (
                                    <Effect
                                        key={index}
                                        setup={({root: content, signal}) => {
                                            setups.push(`${index} ${content.textContent}`);
                                            signals.push(signal);
                                            return () => {
                                                cleanups.push(`${index} ${content.textContent}`);
                                                if (failures[index]) throw failures[index];
                                            };
                                        }}
                                    />
                                ))}
                            </MarkdownViewer>
                        </ErrorBoundary>,
                    ),
                );
            }

            render('<p>A</p>');
            render('<p>B</p>');

            expect(cleanups.sort()).toEqual(['0 A', '1 A', '2 A']);
            expect(setups.sort()).toEqual(['0 A', '1 A', '2 A']);
            expect(signals).toHaveLength(3);
            expect(signals.every((signal) => signal.aborted)).toBe(true);
            expect(caught).toHaveBeenCalledTimes(1);
            expect(container.textContent).toBe('Failed');
            if (errorCount === 1) {
                expect(caught).toHaveBeenCalledWith(failures[0]);
            } else {
                const error = caught.mock.calls[0][0];
                expect(error).toBeInstanceOf(AggregateError);
                expect(error.errors).toHaveLength(2);
                expect(error.errors).toEqual(expect.arrayContaining(failures));
            }
        },
    );

    it('should abort a failed setup and pass its error to the application boundary', () => {
        const failure = new Error('Setup failed');
        expectedErrors.add(failure);
        const caught = vi.fn();
        const signals: AbortSignal[] = [];
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        act(() =>
            root.render(
                <ErrorBoundary onError={caught}>
                    <MarkdownViewer html="<p>A</p>">
                        <Effect
                            setup={({signal}) => {
                                signals.push(signal);
                                throw failure;
                            }}
                        />
                    </MarkdownViewer>
                </ErrorBoundary>,
            ),
        );
        expect(caught).toHaveBeenCalledWith(failure);
        expect(signals).toHaveLength(1);
        expect(signals[0].aborted).toBe(true);
        expect(container.textContent).toBe('Failed');
    });

    it('should remove a late extension when its setup fails inside a child boundary', () => {
        const failure = new Error('Late setup failed');
        expectedErrors.add(failure);
        const setup = vi.fn(() => {
            throw failure;
        });
        const caught = vi.fn();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        act(() => root.render(<MarkdownViewer html="<p>A</p>" />));
        act(() =>
            root.render(
                <MarkdownViewer html="<p>A</p>">
                    <ErrorBoundary onError={caught}>
                        <Effect setup={setup} />
                    </ErrorBoundary>
                </MarkdownViewer>,
            ),
        );
        expect(caught).toHaveBeenCalledWith(failure);
        act(() =>
            root.render(
                <MarkdownViewer html="<p>B</p>">
                    <ErrorBoundary onError={caught}>
                        <Effect setup={setup} />
                    </ErrorBoundary>
                </MarkdownViewer>,
            ),
        );
        expect(setup).toHaveBeenCalledTimes(1);
        expect(container.querySelector('p')?.textContent).toBe('B');
    });
});

function Effect({setup}: {setup: ViewerEffect}) {
    useViewerEffect((context) => setup(context), [setup]);
    return null;
}
