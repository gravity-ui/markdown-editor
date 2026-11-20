import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {FilesGalleryAttrs, useFilesGallery} from './index';

const openGallery = vi.hoisted(() => vi.fn());

vi.mock('@gravity-ui/components', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useGallery: () => ({openGallery}),
}));
vi.mock('@gravity-ui/uikit', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useToaster: () => ({add: vi.fn()}),
}));

function View({html}: {html: string}) {
    const {openFilesGallery} = useFilesGallery();
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
        <div onClick={openFilesGallery} dangerouslySetInnerHTML={{__html: html}} />
    );
}

describe('useFilesGallery', () => {
    let container: HTMLDivElement;
    let root: ReturnType<typeof createRoot>;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        openGallery.mockReset();
        vi.unstubAllGlobals();
    });

    it('should open the clicked image with the images of the content', async () => {
        await render('<img src="/first.png" alt="First"><img src="/second.png" alt="Second">');

        expect((await click('img[alt="Second"]')).defaultPrevented).toBe(true);
        expect(openGallery).toHaveBeenCalledExactlyOnceWith(
            [
                expect.objectContaining({url: '/first.png'}),
                expect.objectContaining({url: '/second.png'}),
            ],
            1,
        );
    });

    it('should skip the images and the links of an opted-out subtree', async () => {
        await render(
            `<div ${FilesGalleryAttrs.Exclude}="true"><img src="/banner.png" alt="Banner"><a href="/poster.png">Poster</a></div>` +
                `<img ${FilesGalleryAttrs.Exclude}="true" src="/side.png" alt="Side">` +
                '<img src="/photo.png" alt="Photo">',
        );

        await click('img[alt="Photo"]');

        expect(openGallery).toHaveBeenCalledExactlyOnceWith(
            [expect.objectContaining({url: '/photo.png'})],
            0,
        );
    });

    it.each(['img[alt="Banner"]', 'a', 'span', 'img[alt="Side"]'])(
        'should leave a click on %s of an opted-out subtree alone',
        async (selector) => {
            await render(
                `<div ${FilesGalleryAttrs.Exclude}="true"><img src="/banner.png" alt="Banner"><a href="/poster.png" target="_blank"><span>Poster</span></a></div>` +
                    `<img ${FilesGalleryAttrs.Exclude}="true" src="/side.png" alt="Side">` +
                    '<img src="/photo.png" alt="Photo">',
            );

            expect((await click(selector)).defaultPrevented).toBe(false);
            expect(openGallery).not.toHaveBeenCalled();
        },
    );

    async function render(html: string) {
        await act(async () => root.render(<View html={html} />));
    }

    async function click(selector: string) {
        const element = container.querySelector(selector);
        assert(element);
        const event = new MouseEvent('click', {bubbles: true, cancelable: true});
        await act(async () => element.dispatchEvent(event));
        return event;
    }
});
