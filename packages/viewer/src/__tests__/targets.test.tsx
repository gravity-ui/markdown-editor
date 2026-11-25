import {type ReactNode, createContext, createRef, useContext, useState} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../tests/utils/act';
import {MarkdownViewer, ViewerTargets} from '../index';

describe('ViewerTargets', () => {
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
        vi.restoreAllMocks();
    });

    it('should append a marked slot and preserve application context and host content', () => {
        const Context = createContext('default');
        function Action() {
            return <button>{useContext(Context)}</button>;
        }

        act(() =>
            root.render(
                <Context.Provider value="Copy link">
                    <MarkdownViewer html='<h2 id="title"><em>Title</em></h2>'>
                        <ViewerTargets selector="h2[id]">{() => <Action />}</ViewerTargets>
                    </MarkdownViewer>
                </Context.Provider>,
            ),
        );

        const host = container.querySelector('h2');
        expect(host?.querySelector('em')?.textContent).toBe('Title');
        const slot = host?.lastElementChild;
        expect(slot?.tagName).toBe('SPAN');
        expect(slot?.hasAttribute('data-markdown-viewer-slot')).toBe(true);
        expect(slot?.querySelector('button')?.textContent).toBe('Copy link');
    });

    it('should render slots when the viewer is mounted in an iframe document', () => {
        const iframe = document.createElement('iframe');
        container.append(iframe);
        const frameDocument = iframe.contentDocument;
        assert(frameDocument);
        const frameContainer = frameDocument.body.appendChild(frameDocument.createElement('div'));
        const frameRoot = createRoot(frameContainer);

        try {
            act(() =>
                frameRoot.render(
                    <MarkdownViewer html="<h2>Title</h2>">
                        <ViewerTargets selector="h2">{() => <button>Action</button>}</ViewerTargets>
                    </MarkdownViewer>,
                ),
            );

            expect(frameContainer.querySelector('h2 button')?.textContent).toBe('Action');
        } finally {
            act(() => frameRoot.unmount());
        }
    });

    it('should update an inline callback without searching again or resetting portal state', () => {
        const content = createRef<HTMLDivElement>();
        function render(label: string) {
            act(() =>
                root.render(
                    <MarkdownViewer ref={content} html='<h2 id="title">Title</h2>'>
                        <ViewerTargets selector="h2[id]">
                            {() => <Counter label={label} />}
                        </ViewerTargets>
                    </MarkdownViewer>,
                ),
            );
        }
        render('First');
        const slot = container.querySelector('[data-markdown-viewer-slot]');
        assert(content.current);
        const search = vi.spyOn(content.current, 'querySelectorAll');
        act(() => container.querySelector('button')?.click());
        render('Next');

        expect(search).not.toHaveBeenCalled();
        expect(container.querySelector('[data-markdown-viewer-slot]')).toBe(slot);
        expect(slot?.textContent).toBe('Next: 1');
    });

    it('should update slot class and style without resetting its content', () => {
        function render(className?: string, color?: string) {
            act(() =>
                root.render(
                    <MarkdownViewer html='<h2 id="title">Title</h2>'>
                        <ViewerTargets selector="h2" className={className} style={{color}}>
                            {() => <Counter label="Count" />}
                        </ViewerTargets>
                    </MarkdownViewer>,
                ),
            );
        }
        render('first', 'red');
        const slot = container.querySelector<HTMLElement>('[data-markdown-viewer-slot]');
        assert(slot);
        expect(slot.className).toBe('first');
        expect(slot.style.color).toBe('red');
        act(() => slot.querySelector('button')?.click());

        render('second', 'blue');
        expect(container.querySelector('[data-markdown-viewer-slot]')).toBe(slot);
        expect(slot.className).toBe('second');
        expect(slot.style.color).toBe('blue');
        expect(slot.textContent).toBe('Count: 1');

        render();
        expect(slot.getAttribute('class')).toBeNull();
        expect(slot.style.color).toBe('');
    });

    it('should keep intersecting hosts and release only departed slots after a selector change', () => {
        const html = '<h2 id="a">A</h2><h2 id="b">B</h2><h2 id="c">C</h2>';
        function render(selector: string) {
            act(() =>
                root.render(
                    <MarkdownViewer html={html}>
                        <ViewerTargets selector={selector}>
                            {(host) => <Counter label={host.id} />}
                        </ViewerTargets>
                    </MarkdownViewer>,
                ),
            );
        }
        render('#a, #b');
        const first = container.querySelector('#a [data-markdown-viewer-slot]');
        const shared = container.querySelector('#b [data-markdown-viewer-slot]');
        act(() => container.querySelector<HTMLButtonElement>('#b button')?.click());
        render('#b, #c');

        expect(first?.parentElement).toBeNull();
        expect(container.querySelector('#a')?.innerHTML).toBe('A');
        expect(container.querySelector('#b [data-markdown-viewer-slot]')).toBe(shared);
        expect(shared?.textContent).toBe('b: 1');
        expect(container.querySelector('#c button')?.textContent).toBe('c: 0');
    });

    it('should use the requested slot element type after it changes', () => {
        function render(as: 'span' | 'div') {
            act(() =>
                root.render(
                    <MarkdownViewer html='<section data-block=""></section>'>
                        <ViewerTargets selector="[data-block]" as={as}>
                            {() => <Counter label="Count" />}
                        </ViewerTargets>
                    </MarkdownViewer>,
                ),
            );
        }
        render('span');
        expect(container.querySelector('[data-markdown-viewer-slot]')?.tagName).toBe('SPAN');
        render('div');

        const slots = container.querySelectorAll('section > [data-markdown-viewer-slot]');
        expect(slots).toHaveLength(1);
        expect(slots[0].tagName).toBe('DIV');
        expect(slots[0].querySelector('button')).not.toBeNull();
    });

    it('should exclude slots and their descendants from later target searches', () => {
        function render(showSecond: boolean) {
            act(() =>
                root.render(
                    <MarkdownViewer html='<section data-host=""><svg data-host=""></svg></section>'>
                        <ViewerTargets selector="[data-host]">
                            {() => <span data-host="">Owned content</span>}
                        </ViewerTargets>
                        {showSecond && (
                            <ViewerTargets selector="[data-host], [data-markdown-viewer-slot]">
                                {() => <button>Second</button>}
                            </ViewerTargets>
                        )}
                    </MarkdownViewer>,
                ),
            );
        }
        render(false);
        render(true);

        expect(container.querySelectorAll('section > [data-markdown-viewer-slot]')).toHaveLength(2);
        expect(container.querySelectorAll('button')).toHaveLength(1);
        expect(
            container.querySelector('[data-markdown-viewer-slot] [data-markdown-viewer-slot]'),
        ).toBeNull();
        expect(container.querySelector('svg')?.children).toHaveLength(0);
    });

    it('should preserve another extension when siblings are reordered or one is removed', () => {
        const first = (
            <ViewerTargets key="first" selector="h2[id]">
                {() => <Counter label="First" />}
            </ViewerTargets>
        );
        const second = (
            <ViewerTargets key="second" selector="h2[id]">
                {() => <Counter label="Second" />}
            </ViewerTargets>
        );
        act(() =>
            root.render(
                <MarkdownViewer html='<h2 id="title">Title</h2>'>
                    {first}
                    {second}
                </MarkdownViewer>,
            ),
        );
        const buttons = container.querySelectorAll('button');
        act(() => buttons[1].click());
        act(() =>
            root.render(
                <MarkdownViewer html='<h2 id="title">Title</h2>'>
                    {second}
                    {first}
                </MarkdownViewer>,
            ),
        );
        expect(container.querySelector('h2')?.contains(buttons[0])).toBe(true);
        expect(container.querySelector('h2')?.contains(buttons[1])).toBe(true);
        expect(buttons[1].textContent).toBe('Second: 1');

        act(() =>
            root.render(
                <MarkdownViewer html='<h2 id="title">Title</h2>'>{[second]}</MarkdownViewer>,
            ),
        );
        expect(container.querySelectorAll('[data-markdown-viewer-slot]')).toHaveLength(1);
        expect(container.querySelector('button')).toBe(buttons[1]);
        expect(container.querySelector('h2')?.firstChild?.textContent).toBe('Title');
    });

    it('should give each target to the first matching slot in registration order', () => {
        function slot(name: string, selector: string, label = name) {
            return (
                <ViewerTargets key={name} selector={selector} slotKey="action">
                    {() => label}
                </ViewerTargets>
            );
        }
        const update = (...slots: ReactNode[]) =>
            renderTargets('<h2></h2><h3></h3><h4></h4>', ...slots);
        const second = slot('B', 'h3,h4');
        const third = slot('C', 'h3');

        update(slot('A', 'h2,h3'), second, third);
        const shared = container.querySelector('h3 > span');
        expect(container.querySelector('h2')?.textContent).toBe('A');
        expect(container.querySelector('h3')?.textContent).toBe('A');
        expect(container.querySelector('h4')?.textContent).toBe('B');

        update(third, second, slot('A', 'h3', 'Updated'));
        expect(container.querySelector('h3 > span')).toBe(shared);
        expect(shared?.textContent).toBe('Updated');

        update(third, second, slot('A', 'h2'));
        expect(container.querySelector('h3')?.textContent).toBe('B');
        update(slot('A', 'h2,h3'), third, second);
        expect(container.querySelector('h3')?.textContent).toBe('B');
        update(slot('A', 'h2,h3'), third);
        expect(container.querySelector('h3')?.textContent).toBe('C');
    });

    it('should keep an empty named slot until its key changes', () => {
        const waiting = vi.fn(() => 'Copy');
        function update(slotKey: string) {
            renderTargets(
                '<h2></h2>',
                <ViewerTargets key="empty" selector="h2" slotKey={slotKey}>
                    {() => null}
                </ViewerTargets>,
                <ViewerTargets key="copy" selector="h2" slotKey="copy">
                    {waiting}
                </ViewerTargets>,
                <ViewerTargets key="edit" selector="h2" slotKey="edit">
                    {() => 'Edit'}
                </ViewerTargets>,
            );
        }
        update('copy');
        const heading = container.querySelector('h2');
        expect(waiting).not.toHaveBeenCalled();
        expect(heading?.children).toHaveLength(2);
        expect(heading?.textContent).toBe('Edit');

        update('edit');
        expect(heading?.children).toHaveLength(2);
        expect(heading?.textContent).toContain('Copy');
        expect(heading?.textContent).toContain('Edit');
    });

    it('should scope target searches to each viewer root', () => {
        act(() =>
            root.render(
                <>
                    <h2 id="outside">Outside</h2>
                    <MarkdownViewer html='<h2 id="left">Left</h2>'>
                        <ViewerTargets selector="h2[id]">
                            {(host) => <button>{host.id}</button>}
                        </ViewerTargets>
                    </MarkdownViewer>
                    <MarkdownViewer html='<h2 id="right">Right</h2>'>
                        <ViewerTargets selector="h2[id]">
                            {(host) => <button>{host.id}</button>}
                        </ViewerTargets>
                    </MarkdownViewer>
                </>,
            ),
        );

        expect(container.querySelector('#outside')?.innerHTML).toBe('Outside');
        expect(container.querySelector('#left button')?.textContent).toBe('left');
        expect(container.querySelector('#right button')?.textContent).toBe('right');
    });

    it('should discover hosts after initially finding no matches', () => {
        const children = vi.fn(() => <button>Action</button>);
        function render(html: string) {
            act(() =>
                root.render(
                    <MarkdownViewer html={html}>
                        <ViewerTargets selector="h2[id]">{children}</ViewerTargets>
                    </MarkdownViewer>,
                ),
            );
        }
        render('<p>Text</p>');
        expect(children).not.toHaveBeenCalled();
        expect(container.querySelector('[data-markdown-viewer-slot]')).toBeNull();

        render('<h2 id="new">New heading</h2>');
        expect(container.querySelector('#new button')?.textContent).toBe('Action');
    });

    it('should advance named slots independently in the outer viewer and its portal', () => {
        function action(label: string) {
            return (
                <ViewerTargets key={label} selector="p" slotKey="action">
                    {() => label}
                </ViewerTargets>
            );
        }
        const first = action('first');
        const next = action('next');
        function render(outerFirst: boolean, innerFirst: boolean) {
            renderTargets(
                '<p></p><section></section>',
                outerFirst && first,
                next,
                <ViewerTargets key="inner" selector="section" as="div">
                    {() => (
                        <MarkdownViewer html="<p></p>">
                            {innerFirst && first}
                            {next}
                        </MarkdownViewer>
                    )}
                </ViewerTargets>,
            );
        }

        render(true, true);
        const [outer, inner] = Array.from(container.querySelectorAll('p'));
        expect([outer.textContent, inner.textContent]).toEqual(['first', 'first']);
        render(true, false);
        expect([outer.textContent, inner.textContent]).toEqual(['first', 'next']);
        render(false, false);
        expect([outer.textContent, inner.textContent]).toEqual(['next', 'next']);
    });

    function renderTargets(html: string, ...slots: ReactNode[]) {
        act(() => root.render(<MarkdownViewer html={html}>{slots}</MarkdownViewer>));
    }
});

function Counter({label}: {label: string}) {
    const [count, setCount] = useState(0);
    return (
        <button onClick={() => setCount(count + 1)}>
            {label}: {count}
        </button>
    );
}
