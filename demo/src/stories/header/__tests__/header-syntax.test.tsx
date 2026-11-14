import {
    headerContentSizes,
    headerTitleColors,
    headerTitleSizes,
} from '@gravity-ui/markdown-plugin-header';
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

    it('should render a button outside a header with the preview of the editor', async () => {
        const source =
            ':button[Standalone]{href="/standalone" view="outline" color="green" target="_blank"}';
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
        expect(container.querySelectorAll('.g-md-header-plugin')).toHaveLength(0);
        const button = container.querySelector('a.g-md-button-plugin[href="/standalone"]');
        expect(button?.classList.contains('g-md-button-plugin_view_outline')).toBe(true);
        expect(button?.classList.contains('g-md-button-plugin_color_green')).toBe(true);
        expect(button?.getAttribute('target')).toBe('_blank');
        expect(button?.getAttribute('rel')).toBe('noopener noreferrer');
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
            ).filter((style) => style?.includes('assets/test-image.jpg')),
        ).toHaveLength(152);
    });

    it('should render the title examples with the preview of the editor', async () => {
        const source = markupExamplesDocument([
            ...markupExamplesOf('title'),
            ...markupExamplesOf('structure'),
            ...markupExamplesOf('mixed'),
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
        const count = (selector: string) =>
            container.querySelectorAll(`.g-md-header-plugin > .g-md-header-title-plugin${selector}`)
                .length;
        // 63 titles of the sizes and colors, and a title in a half of the 32 + 16 compositions.
        expect(count('')).toBe(87);
        expect(container.querySelectorAll('.g-md-header-title-plugin')).toHaveLength(87);
        // The sanitizer of the preview keeps the heading role and its level.
        expect(count('[role="heading"]')).toBe(87);
        expect(count('[aria-level]')).toBe(87);
        // No size is the size 2; the combined examples have the size 1.
        expect(headerTitleSizes.map((size) => count(`[aria-level="${size}"]`))).toEqual([
            17, 34, 9, 9, 9, 9,
        ]);
        expect(
            headerTitleSizes.map((size) => count(`.g-md-header-title-plugin_size_${size}`)),
        ).toEqual([17, 34, 9, 9, 9, 9]);
        // No color and `auto` add no modifier and no attribute.
        expect(
            headerTitleColors.map((color) => count(`.g-md-header-title-plugin_color_${color}`)),
        ).toEqual([0, 7, 15, 7, 7, 7, 7, 7]);
        expect(count('[data-color]')).toBe(57);
        // The default size adds no attribute.
        expect(count('[data-size]')).toBe(53);
        expect(count('[data-color="yellow"]')).toBe(15);
        expect(
            new Set(
                Array.from(
                    container.querySelectorAll('.g-md-header-title-plugin'),
                    (element) => element.textContent,
                ),
            ),
        ).toEqual(new Set(['Team portal']));
    });

    it.each(headerTitleSizes)(
        'should keep the level %s of a title through the sanitizer of the preview',
        async (size) => {
            const source = `:::header\n\n::header-title[Team portal]{size="${size}"}\n\n:::`;
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
            const titles = container.querySelectorAll('.g-md-header-title-plugin');
            expect(titles).toHaveLength(1);
            expect(titles[0].getAttribute('role')).toBe('heading');
            expect(titles[0].getAttribute('aria-level')).toBe(String(size));
        },
    );

    it('should render the description examples with the preview of the editor', async () => {
        const source = markupExamplesDocument([
            ...markupExamplesOf('description'),
            ...markupExamplesOf('nested'),
            ...markupExamplesOf('structure'),
            ...markupExamplesOf('mixed'),
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
        const count = (selector: string) =>
            container.querySelectorAll(
                `.g-md-header-plugin > .g-md-header-content-plugin${selector}`,
            ).length;
        // 14 descriptions of the sizes, 78 of the marks and links, and a description
        // in a half of the 32 + 16 compositions.
        expect(count('')).toBe(116);
        expect(container.querySelectorAll('.g-md-header-content-plugin')).toHaveLength(116);
        // No size adds no modifier and no attribute; the combined examples have the size 3.
        expect(headerContentSizes.map((size) => count(`[data-size="${size}"]`))).toEqual([
            2, 2, 10, 2, 2, 2,
        ]);
        expect(
            headerContentSizes.map((size) => count(`.g-md-header-content-plugin_size_${size}`)),
        ).toEqual([2, 2, 10, 2, 2, 2]);
        expect(count('[data-size]')).toBe(20);
        // The paragraphs, the marks and the links of the descriptions.
        expect(
            ['> p', ' a[href]', ' strong', ' em', ' ins', ' s', ' code'].map((selector) =>
                count(selector),
            ),
        ).toEqual([127, 57, 45, 44, 35, 40, 41]);
        expect(count(' a[href="/page"]')).toBe(46);
        expect(count(' a[href="https://example.org/docs"]')).toBe(3);
        expect(count(' a[href="#contacts"]')).toBe(1);
        // The marks nest: a link in a mark and a mark in a link.
        expect(
            [' strong a', ' em a', ' ins a', ' s a', ' a strong', ' a em', ' strong em'].map(
                (selector) => count(selector),
            ),
        ).toEqual([2, 1, 1, 1, 1, 1, 1]);
    });

    it('should render the image examples with the preview of the editor', async () => {
        const source = markupExamplesDocument([
            ...markupExamplesOf('image'),
            ...markupExamplesOf('structure'),
            ...markupExamplesOf('mixed'),
            ...selectMarkupExamples(markupSections, 'nested', 78, 78),
            ...selectMarkupExamples(markupSections, 'boundaries', 4, 4),
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
        const count = (selector: string) =>
            container.querySelectorAll(`img.g-md-header-image-plugin${selector}`).length;
        // 15 images of the attributes, an image in a half of the 32 + 16 compositions,
        // the image of the full banner and the image outside a header.
        expect(count('')).toBe(41);
        expect(container.querySelectorAll('.g-md-header-plugin > img')).toHaveLength(40);
        // The sanitizer keeps the address, the alternative text and the title of an image.
        expect(count('[src="assets/test-image.jpg"]')).toBe(41);
        expect(count('[alt]')).toBe(41);
        expect(count('[alt="Team"]')).toBe(31);
        expect(count('[alt=""]')).toBe(10);
        expect(count('[title="Project team"]')).toBe(6);
        expect(count('[title]')).toBe(6);
        // An image is the first block of its header, as written.
        expect(container.querySelectorAll('.g-md-header-plugin > img:first-child')).toHaveLength(
            40,
        );
    });

    it.each([
        ['an unsafe address', `::header-image{src="${['javascript', 'alert(1)'].join(':')}"}`],
        ['a data address', '::header-image{src="data:image/png;base64,AAAA"}'],
        ['no address', '::header-image{alt="Team"}'],
    ])('should render no element for an image with %s', async (_name, markup) => {
        await act(async () => {
            root.render(
                <ThemeProvider theme="light">
                    <SplitModePreview
                        getValue={() => `:::header\n\n${markup}\n\n:::`}
                        needToSanitizeHtml
                    />
                </ThemeProvider>,
            );
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(250);
        });
        expect(container.querySelectorAll('.g-md-header-plugin')).toHaveLength(1);
        expect(container.querySelectorAll('img')).toHaveLength(0);
    });

    it('should render no element for an empty description', async () => {
        const source = markupExamplesDocument(
            selectMarkupExamples(markupSections, 'defaults', 8, 8),
        );
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
        expect(container.querySelectorAll('.g-md-header-plugin')).toHaveLength(1);
        expect(container.querySelector('.g-md-header-plugin')?.childElementCount).toBe(0);
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
