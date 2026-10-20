import {type ReactNode, StrictMode} from 'react';

import {GalleryProvider} from '@gravity-ui/components';
import {ThemeProvider, Toaster, ToasterProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../../tests/utils/act';
import {FilesGallery} from '../../extensions';
import {MarkdownViewer, ViewerTargets} from '../../index';

describe('FilesGallery', () => {
    let container: HTMLDivElement;
    let root: Root;
    let toaster: Toaster;

    beforeEach(() => {
        vi.stubGlobal('matchMedia', (media: string) =>
            Object.assign(new EventTarget(), {matches: false, media, onchange: null}),
        );
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
        Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn(),
        });
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        toaster = new Toaster();
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
        Reflect.deleteProperty(navigator, 'clipboard');
    });

    it('should open the selected image from the current document', async () => {
        await render(
            <MarkdownViewer html='<img src="/first.png" alt="First"><img src="/second.png" alt="Second">'>
                <FilesGallery />
            </MarkdownViewer>,
        );

        const event = await click('img[alt="Second"]');

        expect(event.defaultPrevented).toBe(true);
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Second');
        expect(dialog?.textContent).toContain('2 / 2');
    });

    it('should prefer custom files and keep them before discovered files', async () => {
        await render(
            <MarkdownViewer html='<img src="/custom.png"><img src="/second.png" alt="Second">'>
                <FilesGallery
                    customFiles={[
                        {
                            url: '/custom.png',
                            name: 'Custom',
                            view: <p>Custom view</p>,
                            thumbnail: 'Custom',
                        },
                    ]}
                />
            </MarkdownViewer>,
        );

        await click('img');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Custom view');
        expect(dialog?.textContent).toContain('1 / 2');
    });

    it('should apply file metadata, actions, and overrides to a custom file', async () => {
        await render(
            <MarkdownViewer html='<a class="yfm-file" href="/document" download="Notes" type="text/plain">Read</a>'>
                <FilesGallery
                    resolveCustomItem={(_url, _type, _element, {name, mimetype}) => ({
                        name,
                        view: <p>{mimetype}</p>,
                        thumbnail: 'File',
                        actions: [{id: 'custom', title: 'Details', icon: null}],
                    })}
                    copyUrl={(url) => `https://example.com${url}`}
                    download={(url) => `${url}/download`}
                    overrideItemProps={(_url, type, _element, props) => ({
                        ...props,
                        name: `${props.name} (${type})`,
                    })}
                />
            </MarkdownViewer>,
        );

        await click('a');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Notes (file)');
        expect(dialog?.textContent).toContain('text/plain');
        expect(dialog?.querySelector('[aria-label="Details"]')).not.toBeNull();
        expect(dialog?.querySelector('[aria-label="Copy link"]')).not.toBeNull();
        expect(dialog?.querySelector('[aria-label="Download"]')?.getAttribute('href')).toBe(
            '/document/download',
        );
    });

    it('should copy the URL from the application', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText},
        });
        await render(
            <MarkdownViewer html='<img src="/image.png">'>
                <FilesGallery copyUrl={(url) => `https://example.com${url}`} />
            </MarkdownViewer>,
        );
        await click('img');

        const copy = document.querySelector('[role="dialog"] button[aria-label="Copy link"]');
        assert(copy instanceof HTMLButtonElement);
        await act(async () => copy.click());

        expect(writeText).toHaveBeenCalledWith('https://example.com/image.png');
    });

    it('should keep an open snapshot and read new HTML on the next opening', async () => {
        const update = (html: string) =>
            render(
                <StrictMode>
                    <MarkdownViewer html={html}>
                        <FilesGallery />
                    </MarkdownViewer>
                </StrictMode>,
            );
        await update('<img src="/first.png" alt="First"><img src="/second.png" alt="Second">');
        await click('img');
        await update('<img src="/third.png" alt="Third">');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('First');
        expect(dialog?.textContent).toContain('1 / 2');
        await closeGallery();
        await click('img');
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Third');
        expect(document.querySelector('[role="dialog"]')?.textContent).not.toContain('1 / 2');
    });

    it('should keep the resource lists of viewers under one provider separate', async () => {
        await render(
            <>
                <MarkdownViewer html='<img src="/one.png" alt="One"><img src="/two.png" alt="Two">'>
                    <FilesGallery />
                </MarkdownViewer>
                <MarkdownViewer html='<img src="/other.png" alt="Other"><img src="/last.png" alt="Last">'>
                    <FilesGallery />
                </MarkdownViewer>
            </>,
        );
        await click('img[alt="Two"]');
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain('2 / 2');
        await closeGallery();
        await click('img[alt="Last"]');
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Last');
        expect(dialog?.textContent).toContain('2 / 2');
    });

    it.each(['ctrlKey', 'metaKey'])('should keep native navigation with %s', async (modifier) => {
        await render(
            <MarkdownViewer html='<a href="/image.png" target="_blank">Image</a>'>
                <FilesGallery />
            </MarkdownViewer>,
        );
        const event = await click('a', {[modifier]: true});
        expect(event.defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it('should keep native navigation for linked images and ordinary links', async () => {
        await render(
            <MarkdownViewer html='<a href="#image"><img src="/image.png"></a><a href="#section">Section</a>'>
                <FilesGallery />
            </MarkdownViewer>,
        );
        expect((await click('img')).defaultPrevented).toBe(false);
        expect((await click('a[href="#section"]')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it('should keep native navigation when the resolver skips a file', async () => {
        await render(
            <MarkdownViewer html='<a class="yfm-file" href="/notes" download="Notes" type="text/plain" target="_blank">Read</a>'>
                <FilesGallery resolveCustomItem={() => undefined} />
            </MarkdownViewer>,
        );

        expect((await click('a')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it.each([
        {
            source: 'an image URL',
            html: '<a href="/image.png" title="Image">Open</a>',
            media: 'img',
            url: '/image.png',
        },
        {
            source: 'a video URL',
            html: '<a href="/video.mp4" title="Video">Play</a>',
            media: 'video',
            url: '/video.mp4',
        },
        {
            source: 'YFM metadata without a URL extension',
            html: '<a class="yfm-file" href="/video" download="Video" type="video/mp4">Play</a>',
            media: 'video',
            url: '/video',
        },
    ])('should open media from $source', async ({html, media, url}) => {
        await render(
            <MarkdownViewer html={html}>
                <FilesGallery />
            </MarkdownViewer>,
        );
        await click('a');
        expect(document.querySelector(`[role="dialog"] ${media}`)?.getAttribute('src')).toBe(url);
    });

    it('should open a file when its nested icon is clicked', async () => {
        await render(
            <MarkdownViewer html='<a class="yfm-file" href="/image" download="Image" type="image/png"><svg><path></path></svg><span>Image</span></a>'>
                <FilesGallery />
            </MarkdownViewer>,
        );
        expect((await click('path')).defaultPrevented).toBe(true);
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Image');
    });

    it('should skip resources in React slots', async () => {
        await render(
            <MarkdownViewer html='<img src="/content.png" alt="Content"><div id="slot"></div>'>
                <ViewerTargets selector="#slot">
                    {() => <img src="/react.png" alt="React" />}
                </ViewerTargets>
                <FilesGallery />
            </MarkdownViewer>,
        );
        expect((await click('img[alt="React"]')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        await click('img[alt="Content"]');
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Content');
        expect(dialog?.textContent).not.toContain('1 / 2');
    });

    it('should use updated options without replacing HTML', async () => {
        const update = (name: string) =>
            render(
                <MarkdownViewer html='<img src="/image.png">'>
                    <FilesGallery
                        overrideItemProps={(_url, _type, _element, props) => ({...props, name})}
                    />
                </MarkdownViewer>,
            );
        await update('Old');
        const image = container.querySelector('img');
        await update('New');
        await click('img');
        expect(container.querySelector('img')).toBe(image);
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain('New');
    });

    it('should keep gallery styles when the content class changes', async () => {
        const update = (className: string) =>
            render(
                <MarkdownViewer html='<img src="/image.png">' className={className}>
                    <FilesGallery />
                </MarkdownViewer>,
            );
        await update('old');
        const wrapper = container.querySelector('.g-md-files-gallery');
        assert(wrapper);

        await update('new');

        expect(container.querySelector('.g-md-files-gallery')).toBe(wrapper);
    });

    it('should remove its listener and styles without closing the open gallery', async () => {
        const html = '<img src="/image.png" alt="Image">';
        await render(
            <MarkdownViewer html={html}>
                <FilesGallery />
            </MarkdownViewer>,
        );
        await click('img');
        await render(<MarkdownViewer html={html} />);
        expect(container.querySelector('.g-md-files-gallery')).toBeNull();
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Image');
        await closeGallery();
        expect((await click('img')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    async function render(children: ReactNode) {
        await act(async () => {
            root.render(
                <ThemeProvider lang="en">
                    <ToasterProvider toaster={toaster}>
                        <GalleryProvider>{children}</GalleryProvider>
                    </ToasterProvider>
                </ThemeProvider>,
            );
        });
    }

    async function click(selector: string, options?: MouseEventInit) {
        const element = container.querySelector(selector);
        assert(element);
        const event = new MouseEvent('click', {bubbles: true, cancelable: true, ...options});
        await act(async () => element.dispatchEvent(event));
        return event;
    }

    async function closeGallery() {
        const close = document.querySelector('[role="dialog"] button[aria-label="Close"]');
        assert(close instanceof HTMLButtonElement);
        await act(async () => close.click());
    }
});
