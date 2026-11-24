// @vitest-environment jsdom
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {Simulate, act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {ImageSource} from './ImageSource';

const scriptUrl = ['javascript', 'alert(1)'].join(':');

describe('ImageSource', () => {
    let container: HTMLDivElement;
    let root: Root;
    const onLink = vi.fn();
    const onClose = vi.fn();
    const cancelUpload = vi.fn();

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    async function render({
        image = null,
        upload,
    }: {image?: string | null; upload?: (file: File) => Promise<boolean>} = {}) {
        await act(async () => {
            root.render(
                <ThemeProvider>
                    <ImageSource
                        image={image}
                        limits={{imageTypes: ['image/png'], maxImageSize: 1024}}
                        upload={upload}
                        cancelUpload={cancelUpload}
                        onLink={onLink}
                        onClose={onClose}
                    >
                        {(file) => file}
                    </ImageSource>
                </ThemeProvider>,
            );
        });
    }

    const button = (text: string) => {
        const found = Array.from(container.querySelectorAll('button')).find(
            (element) => element.textContent === text,
        );
        if (!found) throw new Error(`Button "${text}" is missing`);
        return found;
    };

    const alertText = () => container.querySelector('[role="alert"]')?.textContent ?? null;

    async function submitLink(url: string) {
        const input = container.querySelector<HTMLInputElement>('input[placeholder="https://"]');
        if (!input) throw new Error('Link input is missing');
        await act(async () => {
            input.value = url;
            Simulate.change(input);
        });
        await act(async () => button('Submit').click());
    }

    async function attach(file: File) {
        const input = container.querySelector<HTMLInputElement>('input[type="file"]');
        if (!input) throw new Error('File input is missing');
        Object.defineProperty(input, 'files', {value: [file], configurable: true});
        await act(async () => Simulate.change(input));
    }

    const png = (size: number) => new File([new Uint8Array(size)], 'a.png', {type: 'image/png'});

    it('should reject an unsafe link and pass a safe one', async () => {
        await render();
        await submitLink(scriptUrl);
        expect(alertText()).toBe('Unsupported image address');
        expect(onLink).not.toHaveBeenCalled();

        await submitLink('https://example.com/a.png');
        expect(onLink).toHaveBeenCalledWith('https://example.com/a.png');
        expect(alertText()).toBeNull();
    });

    it.each([
        ['type', new File(['a'], 'a.txt', {type: 'text/plain'}), 'Unsupported file format'],
        ['size', png(2048), 'The file is larger than 1 KB'],
    ])('should reject a file of an unsupported %s', async (_name, file, error) => {
        const upload = vi.fn(() => Promise.resolve(true));
        await render({upload});
        await attach(file);
        expect(alertText()).toBe(error);
        expect(upload).not.toHaveBeenCalled();
    });

    it('should show an error when the upload fails', async () => {
        await render({upload: () => Promise.reject(new Error('Network'))});
        await attach(png(16));
        expect(alertText()).toBe('Failed to upload the file');
    });

    it('should cancel the upload and close the form', async () => {
        await render({upload: () => new Promise<boolean>(() => {})});
        await attach(png(16));
        await act(async () => button('Cancel').click());
        expect(cancelUpload).toHaveBeenCalledOnce();
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('should return to the current image on cancel without an upload', async () => {
        await render({image: 'https://example.com/image.png'});
        const replace = container.querySelector<HTMLButtonElement>(
            'button[aria-label="Replace file"]',
        );
        await act(async () => replace?.click());
        expect(container.querySelector('img')).toBeNull();

        await act(async () => button('Cancel').click());
        expect(container.querySelector('img')?.getAttribute('src')).toBe(
            'https://example.com/image.png',
        );
        expect(cancelUpload).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('should cancel the upload when the form is removed during the upload', async () => {
        await render({upload: () => new Promise<boolean>(() => {})});
        await attach(png(16));
        await act(async () => root.render(null));
        expect(cancelUpload).toHaveBeenCalledOnce();
    });

    it('should not cancel anything when the form is removed after the upload', async () => {
        await render({upload: () => Promise.resolve(true)});
        await attach(png(16));
        await act(async () => root.render(null));
        expect(cancelUpload).not.toHaveBeenCalled();
    });
});
