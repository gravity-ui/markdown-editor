// @vitest-environment jsdom
import {act} from 'react-dom/test-utils';
import {describe, expect, it, vi} from 'vitest';

import {createReactRoot, settle} from '../../../../tests/toolbar';
import {deferred, file} from '../../../../tests/upload';

import {ImageSource} from './ImageSource';

const buttonNamed = (name: string) =>
    Array.from(document.querySelectorAll('button')).find(
        (button) => button.textContent === name || button.getAttribute('aria-label') === name,
    );
const alertText = () => document.querySelector('[role="alert"]')?.textContent ?? null;
const linkInput = () => document.querySelector<HTMLInputElement>('input[placeholder="https://"]');
const fileInput = () => document.querySelector<HTMLInputElement>('input[type="file"]');

async function typeInto(input: HTMLInputElement | null, value: string) {
    await act(async () => {
        if (!input) return;
        const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setValue?.call(input, value);
        input.dispatchEvent(new Event('input', {bubbles: true}));
    });
}

async function attach(selected: File) {
    await act(async () => {
        const input = fileInput();
        if (!input) return;
        Object.defineProperty(input, 'files', {value: [selected], configurable: true});
        input.dispatchEvent(new Event('change', {bubbles: true}));
    });
}

describe('Image source form', () => {
    const {render, unmount} = createReactRoot();

    const show = (props: Partial<Parameters<typeof ImageSource>[0]> = {}) => {
        const handlers = {
            onLink: vi.fn(),
            onClose: vi.fn(),
            cancelUpload: vi.fn(),
        };
        const rendered = render(
            <ImageSource image={null} limits={{}} {...handlers} {...props}>
                {(row) => row}
            </ImageSource>,
        );
        return {handlers, rendered};
    };

    const openLinkTab = async () => {
        await act(async () => buttonNamed('Link')?.click());
    };

    it.each([
        {url: 'https://example.com/a.png', link: 'https://example.com/a.png', error: null},
        {url: '  /assets/a.png ', link: '/assets/a.png', error: null},
        {url: ['javascript', 'alert(1)'].join(':'), link: null, error: 'Unsupported image address'},
    ])('should handle the link $url', async ({url, link, error}) => {
        const {handlers, rendered} = show();
        await rendered;
        await openLinkTab();
        await typeInto(linkInput(), url);
        await act(async () => buttonNamed('Submit')?.click());
        expect(handlers.onLink.mock.calls).toEqual(link ? [[link]] : []);
        expect(alertText()).toBe(error);
    });

    it.each([
        {
            name: 'a file of another type',
            limits: {imageTypes: ['image/jpeg']},
            error: 'Unsupported file format',
        },
        {name: 'a large file', limits: {maxImageSize: 1}, error: 'The file is larger than 1 B'},
    ])('should not upload $name', async ({limits, error}) => {
        const upload = vi.fn(() => Promise.resolve(true));
        await show({limits, upload}).rendered;
        await attach(file);
        expect(upload).not.toHaveBeenCalled();
        expect(alertText()).toBe(error);
    });

    it('should show an error when the upload fails', async () => {
        const upload = vi.fn(() => Promise.reject(new Error('Network')));
        await show({upload}).rendered;
        await attach(file);
        await settle(() => alertText());
        expect(alertText()).toBe('Failed to upload the file');
    });

    it('should cancel the upload and close the form on Cancel', async () => {
        const pending = deferred();
        const upload = vi.fn(() => pending.handler().then(() => true));
        const {handlers, rendered} = show({upload});
        await rendered;
        await attach(file);
        expect(upload).toHaveBeenCalledTimes(1);
        await act(async () => buttonNamed('Cancel')?.click());
        expect(handlers.cancelUpload).toHaveBeenCalledTimes(1);
        expect(handlers.onClose).toHaveBeenCalledTimes(1);
    });

    it('should cancel the upload when the form is closed during the upload', async () => {
        const pending = deferred();
        const upload = vi.fn(() => pending.handler().then(() => true));
        const {handlers, rendered} = show({upload});
        await rendered;
        await attach(file);
        await unmount();
        expect(handlers.cancelUpload).toHaveBeenCalledTimes(1);
    });

    it('should show the file of the image and replace it with the form', async () => {
        const {handlers, rendered} = show({image: '/assets/team%20photo.png'});
        await rendered;
        expect(document.body.textContent).toContain('team photo.png');
        expect(linkInput()).toBeNull();
        await act(async () => buttonNamed('Replace file')?.click());
        await openLinkTab();
        expect(linkInput()).not.toBeNull();
        await act(async () => buttonNamed('Cancel')?.click());
        expect(handlers.onClose).not.toHaveBeenCalled();
        expect(linkInput()).toBeNull();
        expect(document.activeElement).toBe(buttonNamed('Replace file'));
    });
});
