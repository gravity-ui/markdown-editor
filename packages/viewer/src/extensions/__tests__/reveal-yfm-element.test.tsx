import {type ReactNode, StrictMode} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../../tests/utils/act';
import {RevealYfmElement} from '../../extensions';
import {MarkdownViewer} from '../../index';

describe('RevealYfmElement', () => {
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

    it('should reveal a target and notify once in StrictMode', () => {
        const onReveal = vi.fn();
        render(
            <StrictMode>
                <MarkdownViewer html='<details><summary>Title</summary><p id="target">Text</p></details>'>
                    <RevealYfmElement id="target" onReveal={onReveal} />
                </MarkdownViewer>
            </StrictMode>,
        );

        expect(container.querySelector('details')?.open).toBe(true);
        expect(onReveal).toHaveBeenCalledExactlyOnceWith(container.querySelector('#target'));
    });

    it('should keep a completed request after HTML replacement', () => {
        const onReveal = vi.fn();
        const update = (text: string) =>
            render(
                <MarkdownViewer
                    html={`<details><summary>Title</summary><p id="target">${text}</p></details>`}
                >
                    <RevealYfmElement id="target" onReveal={onReveal} />
                </MarkdownViewer>,
            );
        update('Before');
        update('After');

        expect(container.querySelector('#target')?.textContent).toBe('After');
        expect(container.querySelector('details')?.open).toBe(false);
        expect(onReveal).toHaveBeenCalledTimes(1);
    });

    it('should reveal a new target and allow returning to a previous target', () => {
        const onReveal = vi.fn();
        const update = (id: string) =>
            render(
                <MarkdownViewer html='<details><summary>Title</summary><p id="first">First</p><p id="second">Second</p></details>'>
                    <RevealYfmElement id={id} onReveal={(element) => onReveal(id, element.id)} />
                </MarkdownViewer>,
            );
        update('first');
        update('second');
        update('first');

        expect(onReveal.mock.calls).toEqual([
            ['first', 'first'],
            ['second', 'second'],
            ['first', 'first'],
        ]);
    });

    it('should not retry a pending request when only the callback changes', () => {
        const firstCallback = vi.fn();
        const latestCallback = vi.fn();
        const update = (html: string, onReveal: (element: Element) => void) =>
            render(
                <MarkdownViewer html={html}>
                    <RevealYfmElement id="target" onReveal={onReveal} />
                </MarkdownViewer>,
            );
        update('<section></section>', firstCallback);

        const target = document.createElement('p');
        target.id = 'target';
        container.querySelector('section')?.append(target);
        update('<section></section>', latestCallback);

        expect(firstCallback).not.toHaveBeenCalled();
        expect(latestCallback).not.toHaveBeenCalled();

        update('<section><p id="target">New HTML</p></section>', latestCallback);
        expect(firstCallback).not.toHaveBeenCalled();
        expect(latestCallback).toHaveBeenCalledExactlyOnceWith(container.querySelector('#target'));
    });

    it.each(['missing', null])(
        'should allow returning to a completed target after requesting %s',
        (nextId) => {
            const onReveal = vi.fn();
            const update = (id: string | null) =>
                render(
                    <MarkdownViewer html='<details><summary>Title</summary><p id="target">Text</p></details>'>
                        <RevealYfmElement id={id} onReveal={onReveal} />
                    </MarkdownViewer>,
                );
            update('target');
            container.querySelector('details')?.removeAttribute('open');
            update(nextId);
            update('target');

            expect(container.querySelector('details')?.open).toBe(true);
            expect(onReveal).toHaveBeenCalledTimes(2);
        },
    );

    it('should cancel a pending request with null and allow a new request', () => {
        const onReveal = vi.fn();
        const update = (id: string | null, html: string) =>
            render(
                <MarkdownViewer html={html}>
                    <RevealYfmElement id={id} onReveal={onReveal} />
                </MarkdownViewer>,
            );
        const html = '<details><summary>Title</summary><p id="target">Text</p></details>';
        update('target', '');
        update(null, html);
        expect(onReveal).not.toHaveBeenCalled();
        expect(container.querySelector('details')?.open).toBe(false);

        update('target', html);
        expect(onReveal).toHaveBeenCalledTimes(1);
        expect(container.querySelector('details')?.open).toBe(true);
    });

    it('should repeat the same request only when its key changes', () => {
        const onReveal = vi.fn();
        const update = (key: number) =>
            render(
                <MarkdownViewer html='<details><summary>Title</summary><p id="target">Text</p></details>'>
                    <RevealYfmElement key={key} id="target" onReveal={onReveal} />
                </MarkdownViewer>,
            );
        update(0);
        container.querySelector('details')?.removeAttribute('open');
        update(0);
        expect(container.querySelector('details')?.open).toBe(false);
        expect(onReveal).toHaveBeenCalledTimes(1);

        update(1);
        expect(container.querySelector('details')?.open).toBe(true);
        expect(onReveal).toHaveBeenCalledTimes(2);
    });

    it('should ignore callback changes after completing a request', () => {
        const firstCallback = vi.fn();
        const nextCallback = vi.fn();
        const update = (onReveal: (element: Element) => void) =>
            render(
                <MarkdownViewer html='<p id="target">Text</p>'>
                    <RevealYfmElement id="target" onReveal={onReveal} />
                </MarkdownViewer>,
            );
        update(firstCallback);
        update(nextCallback);

        expect(firstCallback).toHaveBeenCalledTimes(1);
        expect(nextCallback).not.toHaveBeenCalled();
    });

    it('should resolve a selector within its own viewer only', () => {
        const onReveal = vi.fn();
        render(
            <>
                <MarkdownViewer html='<p class="target">Other viewer</p>' />
                <MarkdownViewer html='<p class="target">First</p><p class="target">Second</p>'>
                    <RevealYfmElement selector=".target" onReveal={onReveal} />
                </MarkdownViewer>
            </>,
        );

        expect(onReveal).toHaveBeenCalledExactlyOnceWith(container.querySelectorAll('.target')[1]);
    });

    it('should reveal a supplied element and ignore an external element', () => {
        const onReveal = vi.fn();
        const update = (element: Element | null) =>
            render(
                <MarkdownViewer html="<details><summary>Title</summary><p>Text</p></details>">
                    <RevealYfmElement element={element} onReveal={onReveal} />
                </MarkdownViewer>,
            );
        update(document.body);
        expect(onReveal).not.toHaveBeenCalled();

        const target = container.querySelector('p');
        update(target);
        expect(container.querySelector('details')?.open).toBe(true);
        expect(onReveal).toHaveBeenCalledExactlyOnceWith(target);
    });

    function render(element: ReactNode) {
        act(() => root.render(element));
    }
});
