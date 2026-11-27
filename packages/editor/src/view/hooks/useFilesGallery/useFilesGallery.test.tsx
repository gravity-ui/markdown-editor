import type * as Components from '@gravity-ui/components';
import type * as Uikit from '@gravity-ui/uikit';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, expect, it, vi} from 'vitest';

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

function View() {
    const {openFilesGallery} = useFilesGallery();
    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- delegated clicks on content
        <div onClick={openFilesGallery}>
            <div data-files-gallery-exclude="true">
                <img src="/team.png" alt="Banner" />
            </div>
            <img src="/team.png" alt="Content" />
        </div>
    );
}

afterEach(() => vi.unstubAllGlobals());

it('skips the banner even when a gallery image uses the same URL', () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const container = document.createElement('div');
    const root = createRoot(container);
    try {
        act(() => root.render(<View />));
        const [banner, content] = container.querySelectorAll('img');
        const click = () => new MouseEvent('click', {bubbles: true, cancelable: true});

        expect(banner.dispatchEvent(click())).toBe(true);
        expect(openGallery).not.toHaveBeenCalled();

        expect(content.dispatchEvent(click())).toBe(false);
        expect(openGallery).toHaveBeenCalledWith([expect.objectContaining({url: '/team.png'})], 0);
    } finally {
        act(() => root.unmount());
    }
});
