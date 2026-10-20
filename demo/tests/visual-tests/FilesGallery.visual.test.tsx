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

    test('should show a pointer over gallery images', async ({page}) => {
        const image = page.getByRole('img', {name: 'Minion', exact: true});

        await image.hover();

        await expect(image).toHaveCSS('cursor', 'pointer');
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
