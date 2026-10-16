import {createRoot} from 'react-dom/client';
import {afterEach, beforeEach, expect, it} from 'vitest';

import {act} from '../../tests/utils/act';
import {MarkdownViewer, useViewerEffect} from '../index';

let viewer: ReturnType<typeof createAsyncViewer>;

beforeEach(() => {
    viewer = createAsyncViewer();
});

afterEach(() => {
    act(() => viewer.root.unmount());
});

it('should ignore stale results after HTML updates', async () => {
    viewer.render('A');
    viewer.render('B');
    viewer.render('C');

    await viewer.complete('B', 'C', 'A');

    expect(viewer.applied).toEqual(['C']);
    expect(viewer.disposed).toEqual(['B', 'A']);
    expect(viewer.container.querySelector('[data-result="C"]')?.textContent).toBe('C');
});

it('should dispose an applied result before replacing HTML', async () => {
    viewer.render('A');
    await viewer.complete('A');

    viewer.render('B');

    expect(viewer.disposed).toEqual(['A']);
    expect(viewer.htmlAtDisposal).toEqual(['<p>A</p>']);
    expect(viewer.container.querySelector('p')?.textContent).toBe('B');
});

it('should dispose a pending result after unmount', async () => {
    viewer.render('A');
    act(() => viewer.root.render(null));

    await viewer.complete('A');

    expect(viewer.applied).toEqual([]);
    expect(viewer.disposed).toEqual(['A']);
    expect(viewer.container.innerHTML).toBe('');
});

function createAsyncViewer() {
    const container = document.createElement('div');
    const root = createRoot(container);
    const pending = new Map<string, () => void>();
    const applied: string[] = [];
    const disposed: string[] = [];
    const htmlAtDisposal: string[] = [];

    return {root, container, applied, disposed, htmlAtDisposal, render, complete};

    function render(documentId: string) {
        act(() => {
            root.render(
                <MarkdownViewer html={`<p>${documentId}</p>`}>
                    <Extension documentId={documentId} />
                </MarkdownViewer>,
            );
        });
    }

    async function complete(...documentIds: string[]) {
        await act(async () => {
            for (const documentId of documentIds) {
                const resolve = pending.get(documentId);
                if (!resolve) throw new Error(`No pending result for ${documentId}`);
                pending.delete(documentId);
                resolve();
            }
        });
    }

    function Extension({documentId}: {documentId: string}) {
        useViewerEffect(
            ({root: content, signal}) => {
                let dispose: (() => void) | undefined;
                const result = new Promise<void>((resolve) => {
                    pending.set(documentId, resolve);
                });
                result.then(() => {
                    const release = () => {
                        disposed.push(documentId);
                        htmlAtDisposal.push(content.innerHTML);
                    };
                    if (signal.aborted) {
                        release();
                        return;
                    }
                    dispose = release;
                    content.setAttribute('data-result', documentId);
                    applied.push(documentId);
                });
                return () => dispose?.();
            },
            [documentId],
        );
        return null;
    }
}
