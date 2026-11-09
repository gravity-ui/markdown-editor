import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {FileForm} from './FileForm';
import {ImageForm} from './ImageForm';

describe.each([
    ['file', FileForm],
    ['image', ImageForm],
] as const)('%s form', (_name, Component) => {
    let container: HTMLDivElement;
    let root: Root;
    const onSubmit = vi.fn();
    const onAttach = vi.fn();
    const onCancel = vi.fn();

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

    async function render(attach = true) {
        await act(async () => {
            root.render(
                <ThemeProvider>
                    <Component
                        onSubmit={onSubmit}
                        onCancel={onCancel}
                        onAttach={attach ? onAttach : undefined}
                    />
                </ThemeProvider>,
            );
        });
    }

    it('should switch from upload to link with the tabs', async () => {
        await render();
        const tabs = container.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        expect(tabs).toHaveLength(2);
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');
        expect(container.querySelector('input[type="file"]')).not.toBeNull();

        await act(async () => tabs[1].click());

        expect(tabs[1].getAttribute('aria-selected')).toBe('true');
        expect(container.querySelector('input[placeholder="https://"]')).not.toBeNull();
    });

    it('should show the link fields when upload becomes unavailable', async () => {
        await render();
        await render(false);

        expect(container.querySelector('[role="tablist"]')).toBeNull();
        expect(container.querySelector('input[placeholder="https://"]')).not.toBeNull();
    });
});
