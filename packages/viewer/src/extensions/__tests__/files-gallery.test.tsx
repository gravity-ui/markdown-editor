import {type ReactNode, StrictMode} from 'react';

import {GalleryProvider} from '@gravity-ui/components';
import {MobileProvider, ThemeProvider} from '@gravity-ui/uikit';
import {createPortal} from 'react-dom';
import {type Root, createRoot} from 'react-dom/client';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {act} from '../../../tests/utils/act';
import {FILES_GALLERY_EXCLUDE_ATTRIBUTE, FilesGallery} from '../../extensions';
import {MarkdownViewer, ViewerTargets} from '../../index';

describe('FilesGallery', () => {
    let container: HTMLDivElement;
    let root: Root;

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

    it('should show a mobile gallery without a stray zero when there are no actions', async () => {
        await render(
            <MarkdownViewer html='<img src="/image.png" alt="Photo">'>
                <FilesGallery />
            </MarkdownViewer>,
            {mobile: true},
        );

        await click('img');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Photo');
        expect(dialog?.textContent).not.toContain('0');
    });

    it('should open images in an iframe and remove the click listener on unmount', async () => {
        const iframe = document.body.appendChild(document.createElement('iframe'));
        try {
            const frame = iframe.contentDocument?.defaultView;
            assert(frame);
            const html = '<img src="/image.png" alt="Frame image">';
            const update = (showGallery: boolean) =>
                render(
                    createPortal(
                        <MarkdownViewer html={html}>
                            {showGallery && <FilesGallery />}
                        </MarkdownViewer>,
                        frame.document.body,
                    ),
                );
            await update(true);
            const image = frame.document.querySelector('img');
            assert(image);
            const clickImage = async () => {
                const event = new frame.MouseEvent('click', {bubbles: true, cancelable: true});
                await act(async () => image.dispatchEvent(event));
                return event.defaultPrevented;
            };

            expect(await clickImage()).toBe(true);
            expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Frame image');
            await closeGallery();

            await update(false);
            expect(await clickImage()).toBe(false);
        } finally {
            await render(null);
            iframe.remove();
        }
    });

    it('should select the clicked image when URLs repeat', async () => {
        await render(
            <MarkdownViewer html='<img src="/same.png" alt="First"><img src="/same.png" alt="Second">'>
                <FilesGallery />
            </MarkdownViewer>,
        );

        await click('img[alt="Second"]');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Second');
        expect(dialog?.textContent).toContain('2 / 2');
    });

    it('should keep additional items before discovered files', async () => {
        await render(
            <MarkdownViewer html='<img src="/custom.png"><img src="/second.png" alt="Second">'>
                <FilesGallery
                    additionalItems={[
                        {
                            name: 'Custom',
                            view: <p>Custom view</p>,
                            thumbnail: 'Custom',
                        },
                    ]}
                />
            </MarkdownViewer>,
        );

        await click('img[alt="Second"]');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Second');
        expect(dialog?.textContent).toContain('3 / 3');
    });

    it('should transform a custom file after adding actions', async () => {
        const resolveCustomItem = vi.fn(({name, mimeType}: {name?: string; mimeType?: string}) => ({
            name,
            view: <p>{mimeType}</p>,
            thumbnail: 'File',
            actions: [{id: 'custom', title: 'Details', icon: null}],
        }));
        await render(
            <MarkdownViewer html='<a class="yfm-file" href="/document" download="Notes" type=" Text/PLAIN ; charset=utf-8">Read</a>'>
                <FilesGallery
                    resolveCustomItem={resolveCustomItem}
                    getCopyUrl={({url}) => `https://example.com${url}`}
                    getDownloadUrl={({url}) => `${url}/download`}
                    transformItem={(props, {type}) => ({
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
        expect(resolveCustomItem).toHaveBeenCalledTimes(1);
    });

    it('should replace an item without merging its previous props', async () => {
        await render(
            <MarkdownViewer html='<img src="/image.png" alt="Original">'>
                <FilesGallery
                    getDownloadUrl={({url}) => url}
                    transformItem={() => ({view: <p>Replacement</p>, thumbnail: 'File'})}
                />
            </MarkdownViewer>,
        );
        await click('img');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Replacement');
        expect(dialog?.textContent).not.toContain('Original');
        expect(dialog?.querySelector('[aria-label="Download"]')).toBeNull();
    });

    it('should exclude filtered items from opening and navigation', async () => {
        await render(
            <MarkdownViewer html='<img src="/skip.png" alt="Skip"><img src="/keep.png" alt="Keep">'>
                <FilesGallery
                    transformItem={(item, source) => (source.name === 'Skip' ? null : item)}
                />
            </MarkdownViewer>,
        );

        expect((await click('img[alt="Skip"]')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        await click('img[alt="Keep"]');
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Keep');
        expect(dialog?.textContent).not.toContain('1 / 2');
    });

    it('should copy the URL from the application', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        const onLinkCopied = vi.fn();
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText},
        });
        await render(
            <MarkdownViewer html='<img src="/image.png">'>
                <FilesGallery
                    getCopyUrl={({url}) => `https://example.com${url}`}
                    onLinkCopied={onLinkCopied}
                />
            </MarkdownViewer>,
        );
        await click('img');

        const copy = document.querySelector('[role="dialog"] button[aria-label="Copy link"]');
        assert(copy instanceof HTMLButtonElement);
        await act(async () => copy.click());

        expect(writeText).toHaveBeenCalledWith('https://example.com/image.png');
        expect(onLinkCopied).toHaveBeenCalledExactlyOnceWith('https://example.com/image.png');
    });

    it('should not report a failed copy as successful', async () => {
        const onLinkCopied = vi.fn();
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {writeText: vi.fn().mockRejectedValue(new Error('Clipboard denied'))},
        });
        await render(
            <MarkdownViewer html='<img src="/image.png">'>
                <FilesGallery getCopyUrl={({url}) => url} onLinkCopied={onLinkCopied} />
            </MarkdownViewer>,
        );
        await click('img');
        const copy = document.querySelector('[role="dialog"] button[aria-label="Copy link"]');
        assert(copy instanceof HTMLButtonElement);
        await act(async () => copy.click());

        expect(onLinkCopied).not.toHaveBeenCalled();
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

    it.each(['ctrlKey', 'metaKey', 'shiftKey', 'altKey'])(
        'should keep native navigation with %s',
        async (modifier) => {
            await render(
                <MarkdownViewer html='<a href="/image.png" target="_blank">Image</a>'>
                    <FilesGallery />
                </MarkdownViewer>,
            );
            const event = await click('a', {[modifier]: true});
            expect(event.defaultPrevented).toBe(false);
            expect(document.querySelector('[role="dialog"]')).toBeNull();
        },
    );

    it('should respect cancellation in onClickCapture', async () => {
        await render(
            <MarkdownViewer
                html='<img src="/image.png">'
                onClickCapture={(event) => event.preventDefault()}
            >
                <FilesGallery />
            </MarkdownViewer>,
        );

        expect((await click('img')).defaultPrevented).toBe(true);
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

    it.each(['#section', '?view=1'])(
        'should keep native navigation for %s on a page with a media path',
        async (href) => {
            const base = document.head.appendChild(document.createElement('base'));
            base.href = '/files/photo.png';
            try {
                await render(
                    <MarkdownViewer html={`<a href="${href}" target="_blank">Open</a>`}>
                        <FilesGallery />
                    </MarkdownViewer>,
                );

                expect((await click('a')).defaultPrevented).toBe(false);
                expect(document.querySelector('[role="dialog"]')).toBeNull();
            } finally {
                base.remove();
            }
        },
    );

    it('should keep native navigation for a mailto link with a media extension', async () => {
        await render(
            <MarkdownViewer html='<a href="mailto:team@example.png" target="_blank">Email</a>'>
                <FilesGallery />
            </MarkdownViewer>,
        );

        expect((await click('a')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it('should keep native navigation without collecting other resources when the resolver skips a file', async () => {
        const resolveCustomItem = vi.fn(() => undefined);
        await render(
            <MarkdownViewer html='<a class="yfm-file" href="/notes" download="Notes" type="text/plain" target="_blank">Read</a><a href="/other">Other</a>'>
                <FilesGallery resolveCustomItem={resolveCustomItem} />
            </MarkdownViewer>,
        );

        expect((await click('a')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(resolveCustomItem).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({url: '/notes'}),
        );
    });

    it.each([
        {
            source: 'an image URL with a query and fragment',
            html: '<a href="/image.png?size=2#preview" title="Image">Open</a>',
            media: 'img',
            url: '/image.png?size=2#preview',
        },
        {
            source: 'a video URL',
            html: '<a href="/video.mp4" title="Video">Play</a>',
            media: 'video',
            url: '/video.mp4',
        },
    ])('should open media from $source', async ({html, media, url}) => {
        await render(
            <MarkdownViewer html={html}>
                <FilesGallery />
            </MarkdownViewer>,
        );
        await click('img,a');
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

    it('should skip resources in an opted-out subtree', async () => {
        await render(
            <MarkdownViewer
                html={
                    `<div ${FILES_GALLERY_EXCLUDE_ATTRIBUTE}="true"><img src="/banner.png" alt="Banner"><a href="/poster.png">Poster</a></div>` +
                    `<img ${FILES_GALLERY_EXCLUDE_ATTRIBUTE}="true" src="/side.png" alt="Side">` +
                    '<img src="/content.png" alt="Content">'
                }
            >
                <FilesGallery />
            </MarkdownViewer>,
        );

        await click('img[alt="Content"]');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Content');
        expect(dialog?.textContent).not.toMatch(/\d+ \/ \d+/);
    });

    it.each(['img[alt="Banner"]', 'a', 'span', 'img[alt="Side"]'])(
        'should keep the native click on %s in an opted-out subtree',
        async (selector) => {
            await render(
                <MarkdownViewer
                    html={
                        `<div ${FILES_GALLERY_EXCLUDE_ATTRIBUTE}="true"><img src="/banner.png" alt="Banner"><a href="/poster.png" target="_blank"><span>Poster</span></a></div>` +
                        `<img ${FILES_GALLERY_EXCLUDE_ATTRIBUTE}="true" src="/side.png" alt="Side">` +
                        '<img src="/content.png" alt="Content">'
                    }
                >
                    <FilesGallery />
                </MarkdownViewer>,
            );

            expect((await click(selector)).defaultPrevented).toBe(false);
            expect(document.querySelector('[role="dialog"]')).toBeNull();
        },
    );

    it('should open a nested viewer gallery inside an outer React slot', async () => {
        await render(
            <MarkdownViewer html='<img src="/outer.png" alt="Outer"><div id="slot"></div>'>
                <ViewerTargets selector="#slot">
                    {() => (
                        <MarkdownViewer html='<img src="/inner.png" alt="Inner">'>
                            <FilesGallery />
                        </MarkdownViewer>
                    )}
                </ViewerTargets>
                <FilesGallery />
            </MarkdownViewer>,
        );

        expect((await click('img[alt="Inner"]')).defaultPrevented).toBe(true);
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Inner');
        expect(dialog?.textContent).not.toContain('1 / 2');
    });

    it('should use updated options without replacing HTML', async () => {
        const update = (name: string) =>
            render(
                <MarkdownViewer html='<img src="/image.png">'>
                    <FilesGallery transformItem={(props) => ({...props, name})} />
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
        const wrapper = container.querySelector('.g-md-v-files-gallery');
        assert(wrapper);

        await update('new');

        expect(container.querySelector('.g-md-v-files-gallery')).toBe(wrapper);
    });

    it('should keep gallery styles until the last instance unmounts', async () => {
        const html = '<img src="/image.png">';
        const first = <FilesGallery key="first" />;
        const second = <FilesGallery key="second" />;
        const update = (...extensions: ReactNode[]) =>
            render(<MarkdownViewer html={html}>{extensions}</MarkdownViewer>);

        await update(first, second);
        const wrapper = container.querySelector('.g-md-v-files-gallery');
        assert(wrapper);

        await update(second);
        expect(wrapper.classList.contains('g-md-v-files-gallery')).toBe(true);

        await update();
        expect(wrapper.classList.contains('g-md-v-files-gallery')).toBe(false);
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
        expect(container.querySelector('.g-md-v-files-gallery')).toBeNull();
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Image');
        await closeGallery();
        expect((await click('img')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    async function render(children: ReactNode, {mobile = false} = {}) {
        await act(async () => {
            root.render(
                <ThemeProvider lang="en">
                    <MobileProvider mobile={mobile}>
                        <GalleryProvider>{children}</GalleryProvider>
                    </MobileProvider>
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
