import type {ReactNode} from 'react';

import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../../tests/utils/act';
import {type HeadingAnchorTarget, HeadingAnchors} from '../../extensions';
import {MarkdownViewer} from '../../index';

describe('HeadingAnchors', () => {
    let container: HTMLDivElement;
    let root: Root;
    const writeText = vi.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container.appendChild(document.createElement('div')));
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText},
        });
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        Reflect.deleteProperty(navigator, 'clipboard');
        vi.clearAllMocks();
    });

    it('should copy the link provided by the application', async () => {
        const getHref = vi.fn(({id}: HeadingAnchorTarget) => `https://example.com/page#${id}`);
        render(
            <MarkdownViewer html='<h1>Title</h1><h2 id="overview">Overview</h2>'>
                <HeadingAnchors getHref={getHref} />
            </MarkdownViewer>,
        );

        expect(container.querySelector('h1 button')).toBeNull();
        await act(async () => getButton().click());

        expect(writeText).toHaveBeenCalledWith('https://example.com/page#overview');
        expect(getHref).toHaveBeenCalledWith({
            id: 'overview',
            element: container.querySelector('h2'),
        });
        expect(container.querySelector('h2')?.id).toBe('overview');
    });

    it('should pass the click and heading to the application', async () => {
        const onClick = vi.fn();
        const onParentClick = vi.fn();
        container.addEventListener('click', onParentClick);
        render(
            <MarkdownViewer html='<h2 id="overview">Overview</h2>'>
                <HeadingAnchors
                    getHref={({id}) => `#${id}`}
                    onClick={(event, heading) => {
                        event.preventDefault();
                        onClick(event, heading);
                    }}
                />
            </MarkdownViewer>,
        );

        await act(async () => getButton().click());

        expect(onClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({type: 'click'}), {
            id: 'overview',
            element: container.querySelector('h2'),
        });
        expect(writeText).toHaveBeenCalledWith('#overview');
        expect(onParentClick).toHaveBeenCalledOnce();
    });

    it('should use current link and click callbacks', async () => {
        const html = '<h2 id="overview">Overview</h2>';
        const navigate = vi.fn();
        const update = (prefix: string) =>
            render(
                <MarkdownViewer html={html}>
                    <HeadingAnchors
                        getHref={({id}) => `${prefix}#${id}`}
                        onClick={() => navigate(prefix)}
                    />
                </MarkdownViewer>,
            );
        update('/old');
        update('/current');

        await act(async () => getButton().click());

        expect(navigate).toHaveBeenCalledExactlyOnceWith('/current');
        expect(writeText).toHaveBeenCalledWith('/current#overview');
    });

    it('should preserve existing heading content and classes when disabled', () => {
        const html =
            '<h2 id="overview" class="original"><a class="yfm-anchor" href="#overview"></a><em>Overview</em></h2>';
        const update = (anchors: boolean) =>
            render(
                <MarkdownViewer html={html}>
                    {anchors && <HeadingAnchors getHref={() => '#overview'} />}
                </MarkdownViewer>,
            );
        update(true);
        const nativeAnchor = container.querySelector('a');

        update(false);

        expect(container.querySelector('a')).toBe(nativeAnchor);
        expect(container.querySelector('em')?.textContent).toBe('Overview');
        expect(container.querySelector('h2')?.className).toBe('original');
    });

    it('should use a custom heading selector', () => {
        render(
            <MarkdownViewer html='<h2 id="overview">Overview</h2><h3 id="detail">Detail</h3>'>
                <HeadingAnchors selector="h2[id]" getHref={({id}) => `#${id}`} />
            </MarkdownViewer>,
        );

        expect(container.querySelectorAll('button')).toHaveLength(1);
        expect(container.querySelector('#overview button')).toBe(getButton());
    });

    it('should use the language of each viewer', () => {
        render(
            <>
                <ThemeProvider lang="en">
                    <MarkdownViewer html='<h2 id="en">English</h2>'>
                        <HeadingAnchors getHref={() => '/en'} />
                    </MarkdownViewer>
                </ThemeProvider>
                <ThemeProvider lang="ru">
                    <MarkdownViewer html='<h2 id="ru">Русский</h2>'>
                        <HeadingAnchors getHref={() => '/ru'} />
                    </MarkdownViewer>
                </ThemeProvider>
            </>,
        );

        expect(container.querySelector('#en button')?.getAttribute('aria-label')).toBe('Copy link');
        expect(container.querySelector('#ru button')?.getAttribute('aria-label')).toBe(
            'Скопировать ссылку',
        );
    });

    function render(children: ReactNode) {
        act(() => root.render(children));
    }

    function getButton() {
        const button = container.querySelector('button[aria-label="Copy link"]');
        assert(button instanceof HTMLButtonElement);
        return button;
    }
});
