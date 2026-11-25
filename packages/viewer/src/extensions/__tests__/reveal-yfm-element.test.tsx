import {type ReactNode, StrictMode, createRef} from 'react';

import {createPortal} from 'react-dom';
import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../../tests/utils/act';
import {RevealYfmElement} from '../../extensions';
import {MarkdownViewer, revealYfmElement} from '../../index';

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

    it('should resolve the first duplicate id and reveal only the current viewer', () => {
        const {outer, inner, target} = renderNestedViewers();

        expect(revealYfmElement({id: 'target'}, {root: outer})).toBe(target);
        expect(container.querySelector('#outer-cut')?.hasAttribute('open')).toBe(true);
        expect(container.querySelector('#inner-cut')?.hasAttribute('open')).toBe(false);
        expect(revealYfmElement({id: 'target'}, {root: inner})).toBe(target);
        expect(container.querySelector('#inner-cut')?.hasAttribute('open')).toBe(true);
    });

    it.each(['implicit', 'explicit'])(
        'should reveal across viewers with an %s unmarked root',
        (kind) => {
            const {target} = renderNestedViewers();
            const options = kind === 'explicit' ? {root: container} : undefined;

            expect(revealYfmElement(target, options)).toBe(target);
            expect(container.querySelector('#outer-cut')?.hasAttribute('open')).toBe(true);
            expect(container.querySelector('#inner-cut')?.hasAttribute('open')).toBe(true);
        },
    );

    it.each(['element', 'id', 'selector'] as const)(
        'should reveal each viewer around a target in a slot using %s',
        (kind) => {
            const {outer, inner, target} = renderNestedViewers();
            const host = container.querySelector('#host');
            assert(host);
            host.setAttribute('data-markdown-viewer-slot', '');
            host.classList.add('heading-section');
            const request = {
                element: target,
                id: {id: 'target'},
                selector: {selector: '#target'},
            }[kind];

            expect(revealYfmElement(request, {root: outer})).toBe(target);
            expect(container.querySelector('#outer-cut')?.hasAttribute('open')).toBe(true);
            expect(container.querySelector('#inner-cut')?.hasAttribute('open')).toBe(false);
            expect(host.classList.contains('open')).toBe(false);
            expect(inner.classList.contains('open')).toBe(false);
            expect(revealYfmElement(request, {root: inner})).toBe(target);
            expect(container.querySelector('#inner-cut')?.hasAttribute('open')).toBe(true);
            expect(host.classList.contains('open')).toBe(false);
        },
    );

    it('should exclude a target in the nested viewer own slot', () => {
        const {outer, inner, target} = renderNestedViewers();
        target.parentElement?.setAttribute('data-markdown-viewer-slot', '');

        expect(revealYfmElement(target, {root: outer})).toBeNull();
        expect(revealYfmElement(target, {root: inner})).toBeNull();
        expect(container.querySelector('details[open]')).toBeNull();
    });

    it('should reveal a nested tab panel only from its own viewer', () => {
        const {outer, inner, target} = renderNestedViewers(`
            <div class="yfm-tabs">
                <div class="yfm-tab-list"><button class="yfm-tab" aria-controls="panel">Tab</button></div>
                <div id="panel" class="yfm-tab-panel"><p id="target">Inner target</p></div>
            </div>
        `);
        const onClick = vi.fn();
        inner.querySelector('.yfm-tab')?.addEventListener('click', onClick);

        expect(revealYfmElement(target, {root: outer})).toBe(target);
        expect(container.querySelector('#outer-cut')?.hasAttribute('open')).toBe(true);
        expect(onClick).not.toHaveBeenCalled();

        expect(revealYfmElement(target, {root: inner})).toBe(target);
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should reveal each level independently across three nested viewers', () => {
        const {outer, inner} = renderNestedViewers();
        const host = document.createElement('div');
        const innerCut = inner.querySelector('#inner-cut');
        assert(innerCut);
        innerCut.append(host);
        const nestedRoot = createRoot(host);
        const deepest = createRef<HTMLDivElement>();
        try {
            act(() =>
                nestedRoot.render(
                    <MarkdownViewer
                        ref={deepest}
                        html='<details id="deep-cut"><p id="deep-target">Deep</p></details>'
                    />,
                ),
            );
            const target = host.querySelector('p');
            assert(deepest.current);
            const cuts = Array.from(container.querySelectorAll('details'));
            for (const [index, viewer] of [outer, inner, deepest.current].entries()) {
                cuts.forEach((cut) => cut.removeAttribute('open'));
                inner.classList.remove('open');
                expect(revealYfmElement(target, {root: viewer})).toBe(target);
                expect(cuts.map((cut) => cut.open)).toEqual(cuts.map((_, i) => i === index));
                expect(inner.classList.contains('open')).toBe(index === 1);
            }
        } finally {
            act(() => nestedRoot.unmount());
        }
    });

    function renderNestedViewers(
        innerHtml = '<details id="inner-cut"><summary>Inner</summary><p id="target">Inner target</p></details>',
    ) {
        const html =
            '<details id="outer-cut"><summary>Outer</summary><div id="host"></div></details><p id="target">Outer target</p>';
        render(<MarkdownViewer html={html} />);
        const host = container.querySelector('#host');
        assert(host);
        const outer = createRef<HTMLDivElement>();
        const inner = createRef<HTMLDivElement>();
        render(
            <MarkdownViewer html={html} ref={outer}>
                {createPortal(
                    <MarkdownViewer ref={inner} className="heading-section" html={innerHtml} />,
                    host,
                )}
            </MarkdownViewer>,
        );
        const target = host.querySelector('p');
        assert(outer.current);
        assert(inner.current);
        assert(target);
        return {outer: outer.current, inner: inner.current, target};
    }

    function render(element: ReactNode) {
        act(() => root.render(element));
    }
});
