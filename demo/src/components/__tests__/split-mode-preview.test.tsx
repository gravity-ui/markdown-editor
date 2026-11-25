import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';

import {SplitModePreview} from '../SplitModePreview';

describe('SplitModePreview', () => {
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

    it('should use the source line when a heading defines its own data-line', async () => {
        const source = 'Paragraph.\n\n## Heading {data-line=99}';
        const onHeadingEdit = vi.fn();
        await act(async () => {
            root.render(
                <ThemeProvider>
                    <SplitModePreview
                        getValue={() => source}
                        needToSanitizeHtml
                        onHeadingEdit={onHeadingEdit}
                    />
                </ThemeProvider>,
            );
        });
        await act(async () => vi.advanceTimersByTime(200));
        const button = container.querySelector('button[aria-label="Edit"]');
        assert(button instanceof HTMLButtonElement);

        await act(async () => button.click());

        expect(onHeadingEdit).toHaveBeenCalledWith(2, source);
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
        const button = container.querySelector('button[aria-label="Edit"]');
        assert(button instanceof HTMLButtonElement);

        source = 'New paragraph.\n\n# Heading';
        await act(async () => button.click());

        expect(onHeadingEdit).not.toHaveBeenCalled();
    });

    it('should keep reserved URL characters in a sanitized banner background', async () => {
        const address = 'https://cdn.example.com/a(b)/*;image.png?token=a*b&width=800';
        const source = `:::banner{bg-image="${address}"}\nBanner\n:::`;
        await act(async () => {
            root.render(
                <ThemeProvider>
                    <SplitModePreview getValue={() => source} needToSanitizeHtml />
                </ThemeProvider>,
            );
        });
        await act(async () => vi.advanceTimersByTime(200));

        const banner = container.querySelector('.g-md-banner-plugin');
        assert(banner instanceof HTMLElement);
        expect(banner.getAttribute('data-bg-image')).toBe(address);
        expect(banner.getAttribute('style')).toBe(
            String.raw`background-image:url("https://cdn.example.com/a\28 b\29 /\2a ;image.png?token=a\2a b&width=800")`,
        );
    });
});
