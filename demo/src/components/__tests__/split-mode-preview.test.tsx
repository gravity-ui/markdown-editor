import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {SplitModePreview} from '../SplitModePreview';

describe('SplitModePreview heading editing', () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        vi.useFakeTimers();
        container = document.createElement('div');
        document.body.append(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
        vi.useRealTimers();
    });

    it('should ignore an edit click when the source has changed', async () => {
        let source = '# Heading';
        const onHeadingEdit = vi.fn();
        await act(async () => {
            root.render(
                <ThemeProvider>
                    <SplitModePreview getValue={() => source} onHeadingEdit={onHeadingEdit} />
                </ThemeProvider>,
            );
        });
        await act(async () => vi.advanceTimersByTime(200));
        const button = container.querySelector('button[aria-label="Edit section"]');
        assert(button instanceof HTMLButtonElement);

        source = 'New paragraph.\n\n# Heading';
        await act(async () => button.click());

        expect(onHeadingEdit).not.toHaveBeenCalled();
    });
});
