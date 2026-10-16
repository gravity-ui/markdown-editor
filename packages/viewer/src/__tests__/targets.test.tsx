import {createContext, createRef, useContext, useState} from 'react';

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

    it('should search a nested viewer inside an outer portal using its own root', () => {
        act(() =>
            root.render(
                <MarkdownViewer html='<section data-host=""></section>'>
                    <ViewerTargets selector="[data-host]" as="div">
                        {() => (
                            <MarkdownViewer html='<h2 id="inner">Inner</h2>'>
                                <ViewerTargets selector="h2[id]">
                                    {() => <button>Inner action</button>}
                                </ViewerTargets>
                            </MarkdownViewer>
                        )}
                    </ViewerTargets>
                </MarkdownViewer>,
            ),
        );
        expect(container.querySelector('#inner button')?.textContent).toBe('Inner action');
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
