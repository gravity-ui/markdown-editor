import type {MouseEvent as ReactMouseEvent} from 'react';

import type * as Components from '@gravity-ui/components';
import type * as UIKit from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {useFilesGallery} from './useFilesGallery';

const openGallery = vi.fn();

vi.mock('@gravity-ui/components', async (importOriginal) => ({
    ...(await importOriginal<typeof Components>()),
    useGallery: () => ({openGallery}),
}));

vi.mock('@gravity-ui/uikit', async (importOriginal) => ({
    ...(await importOriginal<typeof UIKit>()),
    useToaster: () => ({add: vi.fn()}),
}));

type OpenFilesGallery = ReturnType<typeof useFilesGallery>['openFilesGallery'];

let openFilesGallery: OpenFilesGallery | undefined;

function View() {
    openFilesGallery = useFilesGallery().openFilesGallery;
    return null;
}

describe('useFilesGallery', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
        openGallery.mockClear();
    });

    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });

    const content = document.createElement('div');
    content.innerHTML =
        '<img src="/banner.png" alt="Banner" data-files-gallery-exclude="true"><img src="/keep.png" alt="Keep">';

    function click(selector: string) {
        const target = content.querySelector(selector);
        if (!target) throw new Error(`${selector} is missing`);
        const preventDefault = vi.fn();
        const event = {
            target,
            currentTarget: content,
            ctrlKey: false,
            metaKey: false,
            preventDefault,
        };
        act(() => {
            openFilesGallery?.(event as unknown as ReactMouseEvent<HTMLDivElement>);
        });
        return {defaultPrevented: preventDefault.mock.calls.length > 0};
    }

    it('should keep an excluded image out of opening and navigation', () => {
        act(() => {
            root.render(<View />);
        });

        expect(click('img[alt="Banner"]').defaultPrevented).toBe(false);
        expect(openGallery).not.toHaveBeenCalled();

        expect(click('img[alt="Keep"]').defaultPrevented).toBe(true);
        expect(openGallery).toHaveBeenCalledOnce();
        const [items, index] = openGallery.mock.calls[0];
        expect(items.map((item: {url: string}) => item.url)).toEqual(['/keep.png']);
        expect(index).toBe(0);
    });
});
