import type {ReactNode} from 'react';

import {Provider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../../tests/utils/act';
import {HeadingEditButtons} from '../../extensions';
import {MarkdownViewer} from '../../index';

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

    it('should pass the click event, source line, and heading element', async () => {
        const onClick = vi.fn();
        await render(
            <MarkdownViewer html='<h1>Title</h1><h2 data-line="0">Heading</h2>'>
                <HeadingEditButtons onClick={onClick} />
            </MarkdownViewer>,
        );

        const heading = container.querySelector('h2');
        assert(heading instanceof HTMLElement);
        const button = container.querySelector('button[aria-label="Edit"]');
        assert(button instanceof HTMLButtonElement);
        expect(container.querySelector('h1 button')).toBeNull();
        await act(async () => button.click());

        expect(onClick).toHaveBeenCalledOnce();
        const [event, target] = onClick.mock.calls[0];
        expect(event.target).toBe(button);
        expect(target?.line).toBe(0);
        expect(target?.element).toBe(heading);
    });

    it('should skip headings with blank line metadata', async () => {
        await render(
            <MarkdownViewer html='<h2 data-line="">Empty</h2><h2 data-line="  ">Blank</h2>'>
                <HeadingEditButtons onClick={vi.fn()} />
            </MarkdownViewer>,
        );

        expect(container.querySelector('button')).toBeNull();
    });

    it('should localize the default label for each viewer', async () => {
        await render(
            <>
                <Provider lang="en">
                    <MarkdownViewer html='<h2 id="en" data-line="0">Heading</h2>'>
                        <HeadingEditButtons onClick={() => {}} />
                    </MarkdownViewer>
                </Provider>
                <Provider lang="ru">
                    <MarkdownViewer html='<h2 id="ru" data-line="0">Заголовок</h2>'>
                        <HeadingEditButtons onClick={() => {}} />
                    </MarkdownViewer>
                </Provider>
            </>,
        );

        expect(container.querySelector('#en button')?.getAttribute('aria-label')).toBe('Edit');
        expect(container.querySelector('#ru button')?.getAttribute('aria-label')).toBe(
            'Редактировать',
        );
    });

    it('should use a custom selector and label', async () => {
        await render(
            <MarkdownViewer html='<h1 data-line="0">Title</h1><h2 data-line="2">Section</h2>'>
                <HeadingEditButtons
                    selector="h2[data-line]"
                    label="Edit this heading"
                    onClick={vi.fn()}
                />
            </MarkdownViewer>,
        );

        expect(container.querySelector('h1 button')).toBeNull();
        expect(container.querySelector('h2 button')?.getAttribute('aria-label')).toBe(
            'Edit this heading',
        );
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
        const button = container.querySelector('button[aria-label="Edit"]');
        assert(button instanceof HTMLButtonElement);

        await act(async () => button.click());

        expect(onClick).toHaveBeenCalledOnce();
        expect(onParentClick).not.toHaveBeenCalled();
    });

    it('should render one edit button when selectors overlap', async () => {
        await render(
            <MarkdownViewer html='<h2 data-line="4">Heading</h2>'>
                <HeadingEditButtons onClick={vi.fn()} />
                <HeadingEditButtons selector="h2[data-line]" onClick={vi.fn()} />
            </MarkdownViewer>,
        );

        expect(container.querySelectorAll('h2 button')).toHaveLength(1);
    });

    async function render(children: ReactNode) {
        await act(async () => root.render(children));
    }
});
