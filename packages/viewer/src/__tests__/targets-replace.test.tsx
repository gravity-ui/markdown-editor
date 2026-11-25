import type {ReactNode} from 'react';

import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../tests/utils/act';
import {MarkdownViewer, ViewerTargets} from '../index';

const gridHtml = '<section id="grid"><p>Fallback</p></section>';

describe('ViewerTargets replace mode', () => {
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

    it('should keep the host and restore the original children in order', () => {
        const html = '<div id="grid">Before<!--note--><button>Fallback</button>After</div>';
        render(html);
        const host = container.querySelector('#grid');
        assert(host);
        const original = Array.from(host.childNodes);

        render(html, replace('Grid'));
        expect(container.querySelector('#grid')).toBe(host);
        expect(host.textContent).toBe('Grid');
        expect(host.childNodes).toHaveLength(1);

        render(html);
        expect(host.childNodes).toHaveLength(original.length);
        original.forEach((node, index) => expect(host.childNodes[index]).toBe(node));
    });

    it('should hand the target to the next replacement without reconnecting its original children', () => {
        render(gridHtml);
        const host = container.querySelector('#grid');
        const fallback = container.querySelector('p');
        assert(host && fallback);
        const next = replace('Next');
        render(gridHtml, replace('First'), next);

        const observer = new MutationObserver(() => {});
        observer.observe(host, {childList: true});
        render(gridHtml, next);
        const added = observer.takeRecords().flatMap((record) => Array.from(record.addedNodes));
        observer.disconnect();
        expect(added).not.toContain(fallback);
        expect(host.textContent).toBe('Next');
        render(gridHtml);
        expect(host.firstChild).toBe(fallback);
    });

    it.each([undefined, 'actions'])(
        'should give an earlier append with slotKey %s the target before the next replacement',
        (slotKey) => {
            const first = replace('First');
            const actions = append('Actions', '#grid', slotKey);
            const second = replace('Second');
            render(gridHtml, first, actions, second);
            expect(container.textContent).toBe('First');

            render(gridHtml, second, actions, first);
            expect(container.textContent).toBe('First');
            render(gridHtml, second, actions);
            expect(container.textContent).toBe('FallbackActions');
            render(gridHtml, second);
            expect(container.textContent).toBe('Second');
        },
    );

    it('should give a waiting replacement priority over a later named slot', () => {
        const first = append('First', '#grid', 'actions');
        const table = replace('Table');
        const second = append('Second', '#grid', 'actions');
        render(gridHtml, first, table, second);
        expect(container.textContent).toBe('FallbackFirst');

        render(gridHtml, table, second);
        expect(container.textContent).toBe('Table');
        render(gridHtml, second);
        expect(container.textContent).toBe('FallbackSecond');
    });

    it('should let independent replacements run while their parent waits for both', () => {
        const html = '<section id="grid"><div id="left"></div><div id="right"></div></section>';
        const left = replace('Left', '#left');
        const grid = replace('Table');
        const right = replace('Right', '#right');

        render(html, left, grid);
        render(html, left, grid, right);
        expect(container.textContent).toBe('LeftRight');
        render(html, grid, right);
        expect(container.textContent).toBe('Right');
        const nextRight = replace('Next right', '#right');
        render(html, grid, right, nextRight);
        render(html, grid, nextRight);
        expect(container.textContent).toBe('Table');
        render(html, nextRight);
        expect(container.textContent).toBe('Next right');
    });

    it('should preserve an ancestor slot while replacing a descendant', () => {
        const html = '<article><section id="grid">Fallback</section></article>';
        const actions = append('Actions', 'article');
        const table = replace('Table');
        render(html, actions);
        const slot = container.querySelector('article > span');
        assert(slot);

        render(html, actions, table);
        expect(container.textContent).toBe('TableActions');
        expect(container.querySelector('article > span')).toBe(slot);
    });

    it('should keep the earlier claim on a hidden child when its owner narrows the selector', () => {
        const html =
            '<section id="outer"><section id="inner"></section></section><section id="aside"></section>';
        const waiting = replace('Next outer', '#outer');
        const sections = (selector: string) => replace('Sections', selector, (host) => host.id);
        render(html, sections('section'), waiting);
        expect(container.textContent).toBe('outeraside');
        render(html, sections('#inner'), waiting);
        expect(container.textContent).toBe('inner');
        render(html, waiting);
        expect(container.textContent).toBe('Next outer');
    });

    it('should defer a slot on a child added while its ancestor is replaced', () => {
        const table = replace('Table');
        render(gridHtml, table);
        const host = container.querySelector('#grid');
        assert(host);
        const button = document.createElement('button');
        host.append(button);

        const action = append('Action', 'button');
        render(gridHtml, table, action);
        expect(button.textContent).toBe('');
        render(gridHtml, action);
        expect(button.textContent).toBe('Action');
    });

    it('should keep an empty replacement until it releases the target', () => {
        const renderNext = vi.fn(() => 'Next');
        const next = replace('Next', '#grid', renderNext);
        render(
            gridHtml,
            replace('Empty', '#grid', () => null),
            next,
        );
        expect(container.textContent).toBe('');
        expect(renderNext).not.toHaveBeenCalled();

        render(gridHtml, next);
        expect(container.textContent).toBe('Next');
    });

    it('should register a changed mode behind a waiting replacement and render only available targets', () => {
        const html = gridHtml + '<aside id="free"></aside>';
        const waiting = replace('Waiting');
        render(html, append('First'), waiting);
        expect(container.textContent).toBe('FallbackFirst');

        const hosts = new Set<string>();
        const changed = replace('First', '#grid, aside', (host) => {
            hosts.add(host.id);
            return host.id;
        });
        render(html, changed, waiting);
        expect(container.textContent).toBe('Waitingfree');
        expect([...hosts]).toEqual(['free']);
        render(html, changed);
        expect(container.textContent).toBe('gridfree');
    });

    it.each([
        {selector: 'p', result: 'FallbackChild action'},
        {selector: '#grid > p, aside', result: 'FallbackChild action'},
        {selector: 'aside', result: 'Next table'},
    ])(
        'should keep a waiting descendant only if it still matches $selector',
        ({selector, result}) => {
            const childOwner = replace('Child owner', 'p');
            const parent = replace('Table');
            const childWaiter = append('Child action', 'p');
            const nextParent = replace('Next table');
            render(gridHtml, childOwner, parent, childWaiter);
            expect(container.textContent).toBe('Child owner');
            render(gridHtml, parent, childWaiter, nextParent);
            expect(container.textContent).toBe('Table');

            const updatedWaiter = append('Child action', selector);
            render(gridHtml, parent, updatedWaiter, nextParent);
            render(gridHtml, updatedWaiter, nextParent);
            expect(container.textContent).toBe(result);
        },
    );

    it('should find waiting children of independent sections in one search', () => {
        const html = '<main>' + '<section><p>Text</p></section>'.repeat(4) + '</main>';
        const ancestor = append('Active', 'main');
        const waiting = replace('Waiting', 'main');
        const sections = replace('Section', 'section');
        const selector = ':scope > main > section > p';
        const actions = append('Action', selector);
        render(html, ancestor, waiting, replace('Child', 'p'), sections, actions);
        render(html, ancestor, waiting, sections, actions);
        const viewer = container.querySelector('[data-markdown-viewer-root]');
        assert(viewer);
        const search = vi.spyOn(viewer, 'querySelectorAll');

        render(html, ancestor, waiting, actions);
        expect(search.mock.calls.filter(([value]) => value === selector)).toHaveLength(1);
        expect(container.textContent).toBe('TextAction'.repeat(4) + 'Active');
    });

    it('should find only restored targets using the selector relative to the viewer root', () => {
        const html =
            '<section id="grid"><div><i class="action"></i></div></section><aside></aside>';
        const selector = ':scope > #grid .action, :scope > aside .action';
        const table = replace('Table');
        const actions = append('Actions', selector);
        render(html, table);
        render(html, table, actions);
        const external = document.createElement('i');
        external.className = 'action';
        const aside = container.querySelector('aside');
        assert(aside);
        aside.append(external);

        render(html, actions);
        expect(container.querySelector('#grid .action')?.textContent).toBe('Actions');
        expect(external.childNodes).toHaveLength(0);
    });

    it('should discard waiting claims when replacing the HTML', () => {
        const waiting = vi.fn(() => 'Old');
        const next = replace('Next', '#grid', waiting);
        render(gridHtml, replace('Table'), next);
        render('<section>New</section>', next);
        expect(container.textContent).toBe('New');
        expect(waiting).not.toHaveBeenCalled();
    });

    it('should keep the outer replacement while the nested viewer restores or changes its HTML', () => {
        const html = '<section id="first"><i>Fallback</i></section>';
        const widget = replace('Inner', 'section', (host) => host.id);
        const waiting = vi.fn(() => 'Outer action');
        function renderInner(innerHtml?: string, showWidget = false) {
            render(
                gridHtml,
                <ViewerTargets key="outer" selector="section" mode="replace" as="div">
                    {() =>
                        innerHtml && (
                            <MarkdownViewer html={innerHtml}>{showWidget && widget}</MarkdownViewer>
                        )
                    }
                </ViewerTargets>,
                <ViewerTargets key="waiting" selector="section" slotKey="action">
                    {waiting}
                </ViewerTargets>,
            );
        }

        renderInner(html);
        const fallback = container.querySelector('i');
        assert(fallback);
        renderInner(html, true);
        expect(container.textContent).toBe('first');
        renderInner(html);
        expect(container.querySelector('i')).toBe(fallback);

        renderInner(html, true);
        renderInner('<section id="second"></section>', true);
        expect(container.textContent).toBe('second');
        renderInner();
        expect(container.textContent).toBe('');
        expect(waiting).not.toHaveBeenCalled();
    });

    it('should skip HTML and controls owned by a viewer in a separate React root', () => {
        const html = '<p>Outer</p><section></section>';
        render(html);
        const mount = container.querySelector('section');
        assert(mount);
        const inner = createRoot(mount);
        try {
            act(() =>
                inner.render(
                    <MarkdownViewer html="<p>Inner</p>">
                        <p>Controls</p>
                    </MarkdownViewer>,
                ),
            );
            render(html, replace('Replaced', 'p'));
            expect(container.textContent).toBe('ReplacedInnerControls');
        } finally {
            act(() => inner.unmount());
        }
    });

    function render(html: string, ...extensions: ReactNode[]) {
        act(() => root.render(<MarkdownViewer html={html}>{extensions}</MarkdownViewer>));
    }
});

function replace(
    name: string,
    selector = '#grid',
    children: (host: HTMLElement) => ReactNode = () => name,
) {
    return (
        <ViewerTargets key={name} selector={selector} mode="replace">
            {children}
        </ViewerTargets>
    );
}

function append(name: string, selector = '#grid', slotKey?: string) {
    return (
        <ViewerTargets key={name} selector={selector} slotKey={slotKey}>
            {() => name}
        </ViewerTargets>
    );
}
