import type {ReactNode} from 'react';

import {MarkdownViewer} from '@gravity-ui/markdown-viewer';
import {HeadingAnchors} from '@gravity-ui/markdown-viewer/extensions';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {HeadingEditButtons} from '../HeadingEditButtons';

describe('HeadingEditButtons', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container.appendChild(document.createElement('div')));
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it('should pass the click event and zero-based source line', async () => {
        const onClick = vi.fn();
        await render(
            <MarkdownViewer html='<h1>Title</h1><h2 data-line="0">Heading</h2>'>
                <HeadingEditButtons onClick={onClick} />
            </MarkdownViewer>,
        );

        const button = container.querySelector('button[aria-label="Edit section"]');
        assert(button instanceof HTMLButtonElement);
        expect(container.querySelector('h1 button')).toBeNull();
        await act(async () => button.click());

        expect(onClick).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({target: button}),
            0,
        );
    });

    it('should use a custom heading selector', async () => {
        await render(
            <MarkdownViewer html='<h1 data-line="0">Title</h1><h2 data-line="2">Section</h2>'>
                <HeadingEditButtons selector="h2[data-line]" onClick={vi.fn()} />
            </MarkdownViewer>,
        );

        expect(container.querySelector('h1 button')).toBeNull();
        expect(container.querySelector('h2 button')).toBeInstanceOf(HTMLButtonElement);
    });

    it('should keep an edit click from toggling a folding heading', async () => {
        const onClick = vi.fn();
        const onParentClick = vi.fn();
        container.addEventListener('click', onParentClick);
        await render(
            <MarkdownViewer html='<section class="heading-section"><h2 data-line="2">Heading</h2></section>'>
                <HeadingEditButtons onClick={onClick} />
            </MarkdownViewer>,
        );
        const button = container.querySelector('button[aria-label="Edit section"]');
        assert(button instanceof HTMLButtonElement);

        await act(async () => button.click());

        expect(onClick).toHaveBeenCalledOnce();
        expect(onParentClick).not.toHaveBeenCalled();
    });

    it('should keep edit and anchor clicks independent', async () => {
        const onClick = vi.fn();
        const onAnchorClick = vi.fn();
        await render(
            <MarkdownViewer html='<h2 id="title" data-line="4">Heading</h2>'>
                <HeadingAnchors getHref={() => '#title'} onClick={onAnchorClick} />
                <HeadingEditButtons onClick={onClick} />
            </MarkdownViewer>,
        );
        const button = container.querySelector('button[aria-label="Edit section"]');
        assert(button instanceof HTMLButtonElement);
        await act(async () => button.click());

        expect(onClick).toHaveBeenCalledOnce();
        expect(onAnchorClick).not.toHaveBeenCalled();
    });

    async function render(children: ReactNode) {
        await act(async () => root.render(children));
    }
});
