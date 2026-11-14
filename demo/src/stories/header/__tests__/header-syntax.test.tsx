import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {SplitModePreview} from '../../../components/SplitModePreview';
import {HeaderSyntax} from '../HeaderSyntax';
import {markupExamplesDocument, selectMarkupExamples} from '../examples';
import {markupSections} from '../sections';

const markupExamplesOf = (prefix: string) => selectMarkupExamples(markupSections, prefix);

describe('HeaderSyntax', () => {
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

    it('should render the button examples with the preview of the editor', async () => {
        const source = markupExamplesDocument([
            ...markupExamplesOf('button'),
            ...markupExamplesOf('link'),
        ]);
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
        expect(container.querySelectorAll('.g-md-header-plugin')).toHaveLength(150);
        expect(
            container.querySelectorAll(
                '.g-md-header-plugin > .g-md-button-plugin-row > .g-md-button-plugin',
            ),
        ).toHaveLength(150);
        expect(container.querySelectorAll('.g-md-button-plugin[target="_blank"]')).toHaveLength(30);
        expect(
            container.querySelectorAll('.g-md-button-plugin[rel="noopener noreferrer"]'),
        ).toHaveLength(30);
        expect(container.querySelectorAll('.g-md-button-plugin:not([href])')).toHaveLength(10);
        expect(container.querySelectorAll('.g-md-button-plugin[href="/page"]')).toHaveLength(130);
        expect(container.querySelectorAll('.g-md-button-plugin[target="_parent"]')).toHaveLength(
            30,
        );
        expect(container.querySelectorAll('.g-md-button-plugin[target="_top"]')).toHaveLength(30);
        expect(container.querySelectorAll('.g-md-button-plugin[target="_self"]')).toHaveLength(0);
    });

    it('should render the header examples with the preview of the editor', async () => {
        const source = markupExamplesDocument([
            ...markupExamplesOf('layout'),
            ...markupExamplesOf('background'),
        ]);
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
        const count = (modifier: string) =>
            container.querySelectorAll(`.g-md-header-plugin_${modifier}`).length;
        expect(container.querySelectorAll('.g-md-header-plugin')).toHaveLength(279);
        // 108 examples of the sizes and the alignment; the 171 backgrounds have the default size.
        expect(['s', 'm', 'l'].map((height) => count(`height_${height}`))).toEqual([207, 36, 36]);
        expect(['s', 'm', 'l', 'full'].map((width) => count(`width_${width}`))).toEqual([
            27, 198, 27, 27,
        ]);
        // The defaults, `left` and `center`, add no modifier and no attribute.
        expect(['left', 'center', 'right'].map((align) => count(`align_${align}`))).toEqual([
            0, 36, 36,
        ]);
        expect(
            ['top', 'center', 'bottom'].map((vertical) => count(`vertical_${vertical}`)),
        ).toEqual([36, 0, 36]);
        expect(container.querySelectorAll('.g-md-header-plugin[data-align]')).toHaveLength(72);
        expect(container.querySelectorAll('.g-md-header-plugin[data-vertical]')).toHaveLength(72);
        // 19 fills, the first one omitted, with 9 states of the image each.
        expect(count('bg-color_blue-heavy')).toBe(9);
        expect(container.querySelectorAll('.g-md-header-plugin[data-bg-color]')).toHaveLength(162);
        expect(count('bg-image')).toBe(152);
        expect(count('bg-image-blur')).toBe(76);
        expect(container.querySelectorAll('.g-md-header-plugin.g-root_theme_light')).toHaveLength(
            38,
        );
        expect(container.querySelectorAll('.g-md-header-plugin.g-root_theme_dark')).toHaveLength(
            38,
        );
        // The sanitizer keeps the address of the image in the style of the block.
        expect(
            Array.from(
                container.querySelectorAll<HTMLElement>('.g-md-header-plugin_bg-image'),
                (element) => element.getAttribute('style'),
            ).filter((style) => style?.includes('/assets/test-image.jpg')),
        ).toHaveLength(152);
    });

    it('should show the source and the preview of every example of a section', async () => {
        const sections = markupSections.filter(({title}) => title === 'Button URLs');
        await act(async () => {
            root.render(
                <ThemeProvider theme="light">
                    <HeaderSyntax sections={sections} />
                </ThemeProvider>,
            );
        });
        // The preview is a lazy chunk and renders after a delay.
        await vi.waitFor(
            async () => {
                await act(async () => {
                    await vi.advanceTimersByTimeAsync(250);
                });
                expect(
                    container.querySelectorAll('.g-md-header-plugin .g-md-button-plugin'),
                ).toHaveLength(25);
            },
            {timeout: 10_000},
        );
        const examples = container.querySelectorAll('[data-qa="header-syntax-example"]');
        expect(examples).toHaveLength(25);
        expect(container.querySelector('h2')?.textContent).toBe('Button URLs');
        expect(examples[15].textContent).toContain('link-016 — URL type: HTTPS');
        expect(examples[15].querySelector('pre')?.textContent).toBe(
            ':::header\n\n:button[Learn more]{href="https://example.org/page" view="action" color="blue"}\n:::',
        );
        expect(examples[15].querySelector('.g-md-button-plugin')?.getAttribute('href')).toBe(
            'https://example.org/page',
        );
    }, 15_000);
});
