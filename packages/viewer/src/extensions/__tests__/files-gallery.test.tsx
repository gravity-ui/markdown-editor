import {type ReactNode, StrictMode} from 'react';

import {type GalleryItemProps, GalleryProvider} from '@gravity-ui/components';
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

    it.each(['click', 'Enter', ' '])('should open the selected image with %s', async (action) => {
        await render(
            <MarkdownViewer html='<img src="/first.png" alt="First"><img src="/second.png" alt="Second">'>
                <FilesGallery />
            </MarkdownViewer>,
        );

        const image = container.querySelector('img[alt="Second"]');
        assert(image instanceof HTMLImageElement);
        expect(image.getAttribute('role')).toBe('button');
        expect(image.tabIndex).toBe(0);
        expect(image.getAttribute('aria-label')).toBe('Second');
        image.focus();
        const event =
            action === 'click' ? await click('img[alt="Second"]') : await keydown(image, action);

        expect(event.defaultPrevented).toBe(true);
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Second');
        expect(dialog?.textContent).toContain('2 / 2');
    });

    it.each([-1, 0, 2])('should keep an explicit tabindex of %s', async (tabIndex) => {
        const html = `<img src="/image.png" tabindex="${tabIndex}">`;
        await render(
            <MarkdownViewer html={html}>
                <FilesGallery />
            </MarkdownViewer>,
        );
        const image = container.querySelector('img');
        assert(image);
        expect(image.tabIndex).toBe(tabIndex);
        expect(image.getAttribute('role')).toBe('button');
        image.focus();
        expect(document.activeElement).toBe(image);
        await keydown(image, 'Enter');
        expect(document.querySelector('[role="dialog"]')).not.toBeNull();
        await closeGallery();

        await render(<MarkdownViewer html={html} />);
        expect(image.outerHTML).toBe(html);
    });

    it.each([
        {attributes: '', expected: 'Open image'},
        {attributes: 'alt="Description" title="Title"', expected: 'Description'},
        {attributes: 'aria-labelledby="label"', expected: null},
    ])(
        'should name an image without reading its URL: $attributes',
        async ({attributes, expected}) => {
            await render(
                <MarkdownViewer
                    html={`<span id="label">Label</span><img src="data:image/png;base64,AAAA" ${attributes}>`}
                >
                    <FilesGallery />
                </MarkdownViewer>,
            );
            expect(container.querySelector('img')?.getAttribute('aria-label')).toBe(expected);
        },
    );

    it('should update the fallback name with the language and restore attributes on cleanup', async () => {
        const html = '<img src="/image.png">';
        await render(
            <MarkdownViewer html={html}>
                <FilesGallery />
            </MarkdownViewer>,
        );
        const image = container.querySelector('img');
        assert(image);
        expect(image.getAttribute('aria-label')).toBe('Open image');
        await render(
            <MarkdownViewer html={html}>
                <FilesGallery />
            </MarkdownViewer>,
            {lang: 'ru'},
        );
        expect(image.getAttribute('aria-label')).toBe('Открыть изображение');
        await render(<MarkdownViewer html={html} />, {lang: 'ru'});
        expect(image.outerHTML).toBe(html);
    });

    it('should register a late image once and stop handling pending images on cleanup', async () => {
        const imageHtml = '<img srcset="/image.png 1x" alt="Late image">';
        const pendingHtml = '<img srcset="/pending.png 1x" alt="Pending image">';
        const html = imageHtml + pendingHtml;
        await render(
            <MarkdownViewer html={html}>
                <FilesGallery />
            </MarkdownViewer>,
        );
        const [image, pendingImage] = Array.from(container.querySelectorAll('img'));
        assert(image);
        assert(pendingImage);
        expect(image.hasAttribute('tabindex')).toBe(false);
        Object.defineProperty(image, 'currentSrc', {value: 'https://example.com/image.png'});
        await act(async () => {
            image.dispatchEvent(new Event('load'));
            image.dispatchEvent(new Event('load'));
        });
        expect(image.tabIndex).toBe(0);
        expect(image.getAttribute('aria-label')).toBe('Late image');

        await render(<MarkdownViewer html={html} />);
        expect(image.outerHTML).toBe(imageHtml);
        Object.defineProperty(pendingImage, 'currentSrc', {
            value: 'https://example.com/pending.png',
        });
        await act(async () => pendingImage.dispatchEvent(new Event('load')));
        expect(pendingImage.outerHTML).toBe(pendingHtml);
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

    it('should ignore repeated, modified and canceled keyboard activation', async () => {
        await render(
            <MarkdownViewer html='<img src="/image.png">'>
                <FilesGallery />
            </MarkdownViewer>,
        );
        const image = container.querySelector('img');
        assert(image);
        await keydown(image, 'Enter', {repeat: true});
        for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
            expect((await keydown(image, ' ', {[modifier]: true})).defaultPrevented).toBe(false);
        }
        image.addEventListener('keydown', (event) => event.preventDefault(), {once: true});
        await keydown(image, 'Enter');
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it.each(['presentation', 'none'])(
        'should open a %s image by click without adding keyboard controls',
        async (role) => {
            const html = `<img src="/image.png" alt="" role="${role}">`;
            await render(
                <MarkdownViewer html={html}>
                    <FilesGallery />
                </MarkdownViewer>,
            );
            const image = container.querySelector('img');
            assert(image);
            expect(image.outerHTML).toBe(html);
            for (const key of ['Enter', ' ']) {
                expect((await keydown(image, key)).defaultPrevented).toBe(false);
            }
            expect(document.querySelector('[role="dialog"]')).toBeNull();

            expect((await click('img')).defaultPrevented).toBe(true);
            expect(document.querySelector('[role="dialog"]')).not.toBeNull();
            expect(image.outerHTML).toBe(html);
        },
    );

    it.each([
        '<button><img src="/image.png" alt="Control"></button>',
        '<button><img src="/image.png" role="presentation"></button>',
        '<span role="button"><img src="/image.png" role="none"></span>',
        '<span role="button" tabindex="0"><img src="/image.png" alt="Control"></span>',
        '<img src="/image.png" alt="Control" role="button" tabindex="-1">',
        '<img src="/image.png" alt="Control" role="link" tabindex="0">',
    ])('should preserve an image with its own interactive behavior: %s', async (html) => {
        await render(
            <MarkdownViewer html={html}>
                <FilesGallery />
            </MarkdownViewer>,
        );
        const image = container.querySelector('img');
        assert(image);
        const original = document.createElement('div');
        original.innerHTML = html;
        expect(image.outerHTML).toBe(original.querySelector('img')?.outerHTML);
        expect((await click('img')).defaultPrevented).toBe(false);
        expect((await keydown(image, 'Enter')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
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

            expect((await keydown(image, 'Enter')).defaultPrevented).toBe(true);
            expect(document.querySelector('[role="dialog"]')?.textContent).toContain('Frame image');
            await closeGallery();

            await update(false);
            expect(await clickImage()).toBe(false);
            expect(image.hasAttribute('tabindex')).toBe(false);
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

        const image = container.querySelector('img[alt="Skip"]');
        assert(image instanceof HTMLImageElement);
        expect(image.tabIndex).toBe(0);
        await keydown(image, 'Enter');
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect((await click('img[alt="Skip"]')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        await click('img[alt="Keep"]');
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Keep');
        expect(dialog?.textContent).not.toContain('1 / 2');
    });

    it('should call item callbacks only when opening the gallery', async () => {
        const transformItem = vi.fn((item: Readonly<GalleryItemProps>) => item);
        const getCopyUrl = vi.fn(() => '/copy');
        const getDownloadUrl = vi.fn(() => '/download');
        await render(
            <MarkdownViewer html='<img src="/image.png">'>
                <FilesGallery
                    transformItem={transformItem}
                    getCopyUrl={getCopyUrl}
                    getDownloadUrl={getDownloadUrl}
                />
            </MarkdownViewer>,
        );

        expect(transformItem).not.toHaveBeenCalled();
        expect(getCopyUrl).not.toHaveBeenCalled();
        expect(getDownloadUrl).not.toHaveBeenCalled();
        await click('img');
        expect(transformItem).toHaveBeenCalledTimes(1);
        expect(getCopyUrl).toHaveBeenCalledTimes(1);
        expect(getDownloadUrl).toHaveBeenCalledTimes(1);
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
        await update('<img src="/first.png" alt="First"><img src="/second.png" title="Second">');
        const oldImage = container.querySelector('img[title="Second"]');
        assert(oldImage);
        expect(oldImage.getAttribute('aria-label')).toBe('Second');
        await click('img');
        await update('<img src="/third.png">');
        expect(oldImage.outerHTML).toBe('<img src="/second.png" title="Second">');

        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('First');
        expect(dialog?.textContent).toContain('1 / 2');
        await closeGallery();
        const image = container.querySelector('img');
        assert(image);
        expect(image.getAttribute('aria-label')).toBe('Open image');
        expect((await keydown(image, ' ')).defaultPrevented).toBe(true);
        expect(document.querySelector('[role="dialog"] img')?.getAttribute('src')).toBe(
            '/third.png',
        );
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
        const image = container.querySelector('img');
        assert(image);
        await keydown(image, 'Enter');
        expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it('should keep native navigation for linked images and ordinary links', async () => {
        await render(
            <MarkdownViewer html='<a href="#image"><img src="/image.png"></a><a href="#section">Section</a><button><img src="/button.png"></button><span role="button"><img src="/role.png"></span>'>
                <FilesGallery />
            </MarkdownViewer>,
        );
        expect((await click('img')).defaultPrevented).toBe(false);
        expect((await click('a[href="#section"]')).defaultPrevented).toBe(false);
        for (const image of Array.from(container.querySelectorAll('img'))) {
            expect(image.hasAttribute('tabindex')).toBe(false);
            expect(image.hasAttribute('role')).toBe(false);
            expect((await keydown(image, ' ')).defaultPrevented).toBe(false);
        }
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
        const slotImage = container.querySelector('img[alt="React"]');
        assert(slotImage);
        expect(slotImage.hasAttribute('tabindex')).toBe(false);
        expect((await keydown(slotImage, 'Enter')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        await click('img[alt="Content"]');
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Content');
        expect(dialog?.textContent).not.toContain('1 / 2');
    });

    it('should skip resources inside an excluded element', async () => {
        await render(
            <MarkdownViewer
                html={`<div ${FILES_GALLERY_EXCLUDE_ATTRIBUTE}="true"><img src="/banner.png" alt="Banner"><a href="/file.pdf">File</a></div><img src="/content.png" alt="Content">`}
            >
                <FilesGallery />
            </MarkdownViewer>,
        );
        expect((await click('img[alt="Banner"]')).defaultPrevented).toBe(false);
        expect((await click('a')).defaultPrevented).toBe(false);
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        await click('img[alt="Content"]');
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.textContent).toContain('Content');
        expect(dialog?.textContent).not.toContain('1 / 2');
    });

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

        const image = container.querySelector('img[alt="Inner"]');
        assert(image);
        const onClick = vi.fn();
        image.addEventListener('click', onClick);
        expect((await keydown(image, 'Enter')).defaultPrevented).toBe(true);
        expect(onClick).toHaveBeenCalledTimes(1);
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

    it.each([
        {
            html: '<img src="/image.png" role="img" tabindex="-1" aria-label="Custom">',
            label: 'Custom',
        },
        {html: '<img src="/image.png">', label: 'Open image'},
    ])(
        'should restore styles and image attributes after the last instance unmounts: $label',
        async ({html, label}) => {
            const first = <FilesGallery key="first" />;
            const second = <FilesGallery key="second" />;
            const update = (...extensions: ReactNode[]) =>
                render(<MarkdownViewer html={html}>{extensions}</MarkdownViewer>);

            await update(first, second);
            const wrapper = container.querySelector('.g-md-v-files-gallery');
            assert(wrapper);
            const image = container.querySelector('img');
            assert(image);
            expect(image.getAttribute('aria-label')).toBe(label);

            await update(second);
            expect(wrapper.classList.contains('g-md-v-files-gallery')).toBe(true);
            expect(image.getAttribute('role')).toBe('button');

            await update();
            expect(wrapper.classList.contains('g-md-v-files-gallery')).toBe(false);
            expect(image.outerHTML).toBe(html);
            expect((await keydown(image, 'Enter')).defaultPrevented).toBe(false);
            expect(document.querySelector('[role="dialog"]')).toBeNull();
        },
    );

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

    async function render(children: ReactNode, {mobile = false, lang = 'en'} = {}) {
        await act(async () => {
            root.render(
                <ThemeProvider lang={lang}>
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

    async function keydown(element: Element, key: string, options?: KeyboardEventInit) {
        const frame = element.ownerDocument.defaultView;
        assert(frame);
        const event = new frame.KeyboardEvent('keydown', {
            key,
            bubbles: true,
            cancelable: true,
            ...options,
        });
        await act(async () => element.dispatchEvent(event));
        return event;
    }

    async function closeGallery() {
        const close = document.querySelector('[role="dialog"] button[aria-label="Close"]');
        assert(close instanceof HTMLButtonElement);
        await act(async () => close.click());
    }
});
