import {join} from 'node:path';

import {expect, test} from 'playwright/core';

import {ViewerStories} from './MarkdownViewer.helpers';

test.describe('MarkdownViewer files gallery', () => {
    test.beforeEach(async ({mount, page, context}) => {
        await page.route('https://octodex.github.com/images/**', (route) =>
            route.fulfill({path: join(__dirname, 'public/assets/test-image.jpg')}),
        );
        await context.route('https://static.videezy.com/**', (route) => route.abort());
        await mount(<ViewerStories.FilesGallery />, {width: 700});
    });

    test('should open a file with Enter and restore focus after Escape', async ({page}) => {
        const file = page
            .getByTestId('demo-markdown-viewer')
            .getByRole('link', {name: 'Forktocat'});
        const gallery = page.locator('.gc-gallery');

        await file.focus();
        await page.keyboard.press('Enter');
        await expect(gallery).toBeVisible();
        await expect
            .poll(() => gallery.evaluate((element) => element.contains(document.activeElement)))
            .toBe(true);

        await page.keyboard.press('Escape');
        await expect(gallery).toBeHidden();
        await expect(file).toBeFocused();
    });
});

test.describe('MarkdownViewer files gallery resources', () => {
    test.beforeEach(async ({page}) => {
        await page.route('**/gallery-*.svg', (route) =>
            route.fulfill({
                contentType: 'image/svg+xml',
                body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>',
            }),
        );
    });

    test('should show a pointer over viewer images without overriding slot cursors', async ({
        mount,
        page,
    }) => {
        await mount(
            <div data-markdown-viewer-slot="">
                <ViewerStories.FilesGallery
                    documents={[
                        {
                            label: 'Slot images',
                            source: '<img src="/gallery-small.svg" alt="Content"><span data-markdown-viewer-slot><img src="/gallery-small.svg" alt="Slot"></span>',
                        },
                    ]}
                />
            </div>,
        );
        await page.addStyleTag({content: '[data-markdown-viewer-slot] { cursor: help; }'});

        const viewer = page.getByTestId('demo-markdown-viewer');
        await expect(viewer.getByRole('img', {name: 'Content', exact: true})).toHaveCSS(
            'cursor',
            'pointer',
        );
        await expect(viewer.getByRole('img', {name: 'Slot', exact: true})).toHaveCSS(
            'cursor',
            'help',
        );
    });

    test('should open the current picture and srcset resource after resizing', async ({
        mount,
        page,
    }) => {
        await page.setViewportSize({width: 900, height: 700});
        await mount(
            <ViewerStories.FilesGallery
                documents={[
                    {
                        label: 'Responsive image',
                        source: '<picture><source media="(min-width: 600px)" srcset="/gallery-large.svg"><img src="/gallery-fallback.svg" srcset="/gallery-small.svg 1x" alt="Responsive"></picture>',
                    },
                ]}
            />,
        );
        const image = page.getByTestId('demo-markdown-viewer').getByRole('img');

        for (const [width, file] of [
            [900, 'large'],
            [500, 'small'],
        ] as const) {
            await page.setViewportSize({width, height: 700});
            await expect
                .poll(() => image.evaluate((element: HTMLImageElement) => element.currentSrc))
                .toContain(`/gallery-${file}.svg`);
            await image.click();
            await expect(page.getByRole('dialog').locator('img').first()).toHaveAttribute(
                'src',
                new RegExp(`/gallery-${file}\\.svg$`),
            );
            await page
                .getByRole('dialog')
                .getByRole('button', {name: 'Close', exact: true})
                .click();
        }
    });
});
