import {type ReactNode, createRef, version} from 'react';

import {version as domVersion} from 'react-dom';
import {type Root, createRoot, hydrateRoot} from 'react-dom/client';
import {renderToString} from 'react-dom/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../tests/utils/act';
import {MarkdownViewer, cnYFM, useViewerEffect} from '../index';

declare const __VIEWER_REACT_MAJOR__: string;

describe('MarkdownViewer HTML', () => {
    let container: HTMLDivElement;
    let root: Root | undefined;

    beforeEach(() => {
        root = undefined;
        container = document.createElement('div');
        document.body.append(container);
    });

    afterEach(() => {
        act(() => root?.unmount());
        container.remove();
        vi.restoreAllMocks();
    });

    it('should test the requested matching React and React DOM versions', () => {
        expect(version.split('.')[0]).toBe(__VIEWER_REACT_MAJOR__);
        expect(domVersion).toBe(version);
    });

    it('should forward HTML attributes and ref to the content root', () => {
        const ref = createRef<HTMLDivElement>();
        const click = vi.fn();
        render(
            <MarkdownViewer
                ref={ref}
                html="<button>Click</button>"
                qa="content"
                id="document"
                className={cnYFM({'no-list-reset': true})}
                style={{color: 'red'}}
                tabIndex={0}
                aria-label="Document"
                onClick={click}
            >
                <span>Overlay</span>
            </MarkdownViewer>,
        );
        expect(ref.current).toBe(container.querySelector('#document'));
        expect(ref.current?.getAttribute('data-qa')).toBe('content');
        expect(ref.current?.getAttribute('aria-label')).toBe('Document');
        expect(ref.current?.classList.contains('yfm_no-list-reset')).toBe(true);
        expect(ref.current?.style.color).toBe('red');
        expect(ref.current?.tabIndex).toBe(0);
        expect(ref.current?.textContent).toBe('Click');
        act(() => container.querySelector('button')?.click());
        expect(click).toHaveBeenCalledTimes(1);
        expect(container.textContent).toBe('ClickOverlay');
    });

    it('should preserve adapted DOM when the HTML string stays the same', () => {
        render(<MarkdownViewer html="<p>A</p>" title="First" />);
        const paragraph = container.querySelector('p');
        paragraph?.append(' adapted');
        render(<MarkdownViewer html="<p>A</p>" title="Second" />);
        expect(container.querySelector('p')).toBe(paragraph);
        expect(paragraph?.textContent).toBe('A adapted');
    });

    it.runIf(__VIEWER_REACT_MAJOR__ === '19')('should release React 19 callback refs', () => {
        const cleanup = vi.fn();
        const ref = vi.fn(() => cleanup);
        render(<MarkdownViewer html="<p>A</p>" ref={ref} />);
        expect(ref.mock.calls).toHaveLength(1);
        render(null);
        expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should hydrate prepared HTML without replacing nodes or reporting mismatches', async () => {
        const html = '<h2 id="heading">Heading</h2><p>Text &amp; more</p>';
        container.innerHTML = renderToString(<MarkdownViewer html={html} />);
        const heading = container.querySelector('h2');
        const recoverable = vi.fn();
        const setup = vi.fn();
        function Extension() {
            useViewerEffect(setup, []);
            return null;
        }
        const consoleError = vi.spyOn(console, 'error');
        await act(async () => {
            root = hydrateRoot(
                container,
                <MarkdownViewer html={html}>
                    <Extension />
                </MarkdownViewer>,
                {
                    onRecoverableError: recoverable,
                },
            );
        });
        expect(container.querySelector('h2')).toBe(heading);
        expect(setup).toHaveBeenCalledTimes(1);
        expect(recoverable).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();
    });

    function render(element: ReactNode) {
        const currentRoot = (root ??= createRoot(container));
        act(() => currentRoot.render(element));
    }
});
