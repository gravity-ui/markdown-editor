import type {MouseEvent} from 'react';

import type * as Components from '@gravity-ui/components';
import type * as Uikit from '@gravity-ui/uikit';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {FilesGalleryAttrs} from './constants';
import {useFilesGallery} from './useFilesGallery';

const openGallery = vi.fn();

vi.mock('@gravity-ui/components', async (importOriginal) => ({
    ...(await importOriginal<typeof Components>()),
    useGallery: () => ({openGallery}),
}));

vi.mock('@gravity-ui/uikit', async (importOriginal) => ({
    ...(await importOriginal<typeof Uikit>()),
    useToaster: () => ({add: vi.fn()}),
}));

type OpenFilesGallery = ReturnType<typeof useFilesGallery>['openFilesGallery'];

describe('useFilesGallery', () => {
    let content: HTMLDivElement;
    let openFilesGallery: OpenFilesGallery | undefined;

    function View() {
        openFilesGallery = useFilesGallery().openFilesGallery;
        return null;
    }

    beforeEach(async () => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        content = document.createElement('div');
        content.innerHTML = `<div ${FilesGalleryAttrs.Exclude}="true"><img src="/banner.png" alt="Banner"></div><img src="/content.png" alt="Content">`;
        const root = createRoot(document.createElement('div'));
        await act(async () => root.render(<View />));
        act(() => root.unmount());
    });

    afterEach(() => {
        openGallery.mockReset();
        vi.unstubAllGlobals();
    });

    it('should skip images inside an excluded element', () => {
        const event = click('img[alt="Content"]');

        expect(event.preventDefault).toHaveBeenCalled();
        expect(openGallery).toHaveBeenCalledTimes(1);
        const [files, index] = openGallery.mock.calls[0];
        expect(files.map((file: {url: string}) => file.url)).toEqual(['/content.png']);
        expect(index).toBe(0);
    });

    it('should not open the gallery for a click inside an excluded element', () => {
        const event = click('img[alt="Banner"]');

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(openGallery).not.toHaveBeenCalled();
    });

    function click(selector: string) {
        const target = content.querySelector(selector);
        assert(target && openFilesGallery);
        const event = {target, currentTarget: content, preventDefault: vi.fn()};
        openFilesGallery(event as unknown as MouseEvent<HTMLDivElement>);
        return event;
    }
});
