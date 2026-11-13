import {ThemeProvider} from '@gravity-ui/uikit';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {describe, expect, it, vi} from 'vitest';

import {SplitModePreview} from '../SplitModePreview';

describe('Button preview', () => {
    it('should render standalone and nested buttons with the viewer preview', async () => {
        vi.useFakeTimers();
        const container = document.createElement('div');
        document.body.append(container);
        const root = createRoot(container);
        const source =
            ':::button{href="/standalone" view="outline" color="green" target="_blank"}\nStandalone\n:::\n\n:::header\n:::button{href="/nested" color="info"}\nNested\n:::\n:::';
        try {
            await act(async () => {
                root.render(
                    <ThemeProvider theme="light">
                        <SplitModePreview getValue={() => source} needToSanitizeHtml />
                    </ThemeProvider>,
                );
            });
            await act(async () => {
                await vi.advanceTimersByTimeAsync(250);
            });
            const standalone = container.querySelector('a[href="/standalone"]');
            expect(standalone?.classList.contains('g-md-button-plugin_view_outline')).toBe(true);
            expect(standalone?.classList.contains('g-md-button-plugin_color_green')).toBe(true);
            expect(standalone?.getAttribute('target')).toBe('_blank');
            expect(standalone?.getAttribute('rel')).toContain('noopener');
            expect(
                container.querySelector('.g-md-header-plugin a[href="/nested"]')?.textContent,
            ).toBe('Nested');
        } finally {
            await act(async () => {
                root.unmount();
            });
            container.remove();
            vi.useRealTimers();
        }
    });
});
