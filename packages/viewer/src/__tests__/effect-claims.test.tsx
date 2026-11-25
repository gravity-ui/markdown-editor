import type {ReactNode} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../tests/utils/act';
import {
    MarkdownViewer,
    type ViewerEffect,
    type ViewerEffectContext,
    useViewerEffect,
} from '../index';

describe('viewer effect claims', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement('div');
        root = createRoot(container);
    });

    afterEach(() => {
        act(() => root.unmount());
    });

    function render(extensions: ReactNode, html = '<p>First</p>') {
        act(() => root.render(<MarkdownViewer html={html}>{extensions}</MarkdownViewer>));
    }

    it('should run the next claim after cleaning up the first', () => {
        const events: string[] = [];
        const first = <Effect key="first" setup={recordClaim('first', events)} />;
        const second = <Effect key="second" setup={recordClaim('second', events)} />;
        render([first, second]);
        expect(events).toEqual(['start first']);

        render(second);
        expect(events).toEqual(['start first', 'stop first', 'start second']);

        render(null);
        expect(events.at(-1)).toBe('stop second');
    });

    it('should queue a restarted effect behind a waiting claim', () => {
        const events: string[] = [];
        const second = <Effect key="second" setup={recordClaim('second', events)} />;
        const first = (value: string) => <Effect key="first" setup={recordClaim(value, events)} />;
        render([first('old'), second]);

        const updated = first('new');
        render([updated, second]);
        expect(events).toEqual(['start old', 'stop old', 'start second']);

        render(updated);
        expect(events.slice(-2)).toEqual(['stop second', 'start new']);
    });

    it('should run claims for different elements and keys independently', () => {
        const starts: string[] = [];
        const setup: ViewerEffect = ({root: content, claim}) => {
            const [first, second] = Array.from(content.querySelectorAll('p'));
            claim(first, 'edit', () => {
                starts.push('first edit');
            });
            claim(first, 'copy', () => {
                starts.push('first copy');
            });
            claim(second, 'edit', () => {
                starts.push('second edit');
            });
        };

        render(<Effect setup={setup} />, '<p>First</p><p>Second</p>');
        expect(starts).toEqual(['first edit', 'first copy', 'second edit']);
    });

    it('should discard waiting claims before replacing HTML or removing a viewer', () => {
        const starts: string[] = [];
        const first: ViewerEffect = ({root: content, signal, claim}) => {
            const release = claim(content, 'action', () => {
                starts.push(content.textContent ?? '');
            });
            signal.addEventListener('abort', release);
        };
        const waiting = vi.fn();
        const second: ViewerEffect = ({root: content, claim}) => {
            claim(content, 'action', waiting);
        };
        const extensions = (
            <>
                <Effect setup={first} />
                <Effect setup={second} />
            </>
        );
        render(extensions);
        render(extensions, '<p>Next</p>');
        act(() => root.render(null));

        expect(starts).toEqual(['First', 'Next']);
        expect(waiting).not.toHaveBeenCalled();
    });

    it('should accept late claims only while their effect is active', () => {
        const setups: ViewerEffectContext[] = [];
        const start = vi.fn();
        const stop = vi.fn();
        render(
            <Effect
                setup={(context) => {
                    setups.push(context);
                }}
            />,
        );
        const {claim, root: content} = setups[0];
        const release = claim(content, 'late', () => {
            start();
            return stop;
        });
        expect(start).toHaveBeenCalledOnce();
        release();
        release();
        expect(stop).toHaveBeenCalledOnce();

        render(null);
        claim(content, 'late', start);
        expect(start).toHaveBeenCalledOnce();
        expect(stop).toHaveBeenCalledOnce();
    });

    it('should start a waiting claim even if the previous cleanup throws', () => {
        const failure = new Error('Claim cleanup failed');
        let release: () => void;
        const next = vi.fn();
        const setup: ViewerEffect = ({root: content, claim}) => {
            release = claim(content, 'action', () => () => {
                throw failure;
            });
            claim(content, 'action', next);
        };
        render(<Effect setup={setup} />);
        expect(() => release()).toThrow(failure);
        expect(next).toHaveBeenCalledOnce();
    });
});

function Effect({setup}: {setup: ViewerEffect}) {
    useViewerEffect(setup, [setup]);
    return null;
}

function recordClaim(name: string, events: string[]): ViewerEffect {
    return ({root, claim}) => {
        claim(root, 'action', () => {
            events.push(`start ${name}`);
            return () => events.push(`stop ${name}`);
        });
    };
}
