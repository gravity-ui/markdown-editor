import type {ReactNode} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it} from 'vitest';

import {act} from '../../tests/utils/act';
import {MarkdownViewer, VIEWER_SLOT_ATTRIBUTE, ViewerTargets, useViewerEffect} from '../index';

const html = '<section data-text="" data-host="">Host</section><p data-text="">Plain</p>';

describe('ViewerTargets with a DOM adapter', () => {
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

    function render(children: ReactNode) {
        act(() => root.render(<MarkdownViewer html={html}>{children}</MarkdownViewer>));
    }

    it('should skip a slot, its children and its host before a synchronous DOM write', () => {
        render([<Slots key="slots" />]);
        const host = container.querySelector('section');
        assert(host);
        const original = host.innerHTML;
        render([<Slots key="slots" />, <TextAdapter key="adapter" />]);

        expect(host.innerHTML).toBe(original);
        expect(container.querySelector('p')?.textContent).toBe('PLAIN');
    });

    it('should repeat the ownership check when a slot appears during async work', async () => {
        let finish!: () => void;
        const pending = new Promise<void>((resolve) => {
            finish = resolve;
        });
        render([<TextAdapter key="adapter" wait={pending} />]);
        render([<TextAdapter key="adapter" wait={pending} />, <Slots key="slots" />]);
        const host = container.querySelector('section');
        assert(host);
        const original = host.innerHTML;
        const slot = host.querySelector('[data-markdown-viewer-slot]');
        await act(async () => {
            finish();
            await pending;
        });

        expect(host.innerHTML).toBe(original);
        expect(host.querySelector('[data-markdown-viewer-slot]')).toBe(slot);
        expect(container.querySelector('p')?.textContent).toBe('PLAIN');
    });

    it('should avoid restoring old content over a later slot during cleanup', () => {
        render([<TextAdapter key="adapter" />]);
        expect(container.querySelector('section')?.textContent).toBe('HOST');
        render([<TextAdapter key="adapter" />, <Slots key="slots" />]);
        const host = container.querySelector('section');
        assert(host);
        const original = host.innerHTML;
        render([<Slots key="slots" />]);

        expect(host.innerHTML).toBe(original);
        expect(container.querySelector('p')?.textContent).toBe('Plain');
    });
});

function Slots() {
    return (
        <ViewerTargets selector="[data-host]">
            {() => <button data-text="">Action</button>}
        </ViewerTargets>
    );
}

function TextAdapter({wait}: {wait?: Promise<void>}) {
    useViewerEffect(
        ({root, signal}) => {
            const targets = Array.from(
                root.querySelectorAll(`[data-text], [${VIEWER_SLOT_ATTRIBUTE}]`),
            );
            const changed = new Map<Element, string>();
            function apply() {
                if (signal.aborted) return;
                for (const target of targets) {
                    if (!canReplaceContent(target)) continue;
                    const text = target.textContent || '';
                    changed.set(target, text);
                    target.textContent = text.toUpperCase();
                }
            }
            if (wait) {
                wait.then(apply);
            } else {
                apply();
            }
            return () => {
                for (const [target, text] of changed) {
                    if (canReplaceContent(target) && target.textContent === text.toUpperCase()) {
                        target.textContent = text;
                    }
                }
            };
        },
        [wait],
    );
    return null;
}

function canReplaceContent(element: Element) {
    return (
        !element.closest(`[${VIEWER_SLOT_ATTRIBUTE}]`) &&
        !element.querySelector(`[${VIEWER_SLOT_ATTRIBUTE}]`)
    );
}
