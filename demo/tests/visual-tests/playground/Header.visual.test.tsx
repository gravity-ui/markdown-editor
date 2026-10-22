import {expect, test} from 'playwright/core';

import {HeaderDemo} from '../../../src/stories/examples/header/Header';

for (const theme of ['light', 'dark'] as const) {
    test(`should render the cover and settings in the ${theme} theme`, async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await page.emulateMedia({colorScheme: theme});
        await page.setViewportSize({width: 1440, height: 1100});
        await mount(<HeaderDemo markupKey="designSettings" />, {width: 1100});
        const header = page.locator('.g-md-header');
        await expect(header).toHaveCSS('width', '900px');
        await expect(header).toHaveCSS('min-height', '236px');
        await expect(header).toHaveCSS('border-radius', '24px');
        await expect(header.locator('.g-md-header__media img')).toBeVisible();
        await expect(header.locator('.g-md-header__media')).toHaveCSS('width', '434px');
        await expectScreenshot({
            component: page.getByTestId('g-md-editor-mode'),
            themes: [theme],
            nameSuffix: 'cover',
        });
        await header.hover();
        const toolbar = page.getByTestId('g-md-toolbar-header');
        await expect(toolbar.getByRole('button')).toHaveCount(3);
        await toolbar.getByRole('button', {name: 'Block settings'}).click();
        const settings = page.getByTestId('g-md-header-settings');
        await expect(settings).toHaveCSS('position', 'fixed');
        await expect(settings).toHaveCSS('width', '320px');
        await expectScreenshot({component: settings, themes: [theme], nameSuffix: 'settings'});
    });
}

test('should preserve hidden text and three independently editable buttons', async ({
    mount,
    page,
    editor,
}) => {
    await mount(<HeaderDemo markupKey="design" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByTestId('g-md-header-settings');
    await settings.getByRole('switch', {name: 'Title', exact: true}).press('Space');
    await expect(header.locator('.g-md-header__title')).toBeHidden();
    await settings.getByRole('switch', {name: 'Title', exact: true}).press('Space');
    await expect(header.locator('.g-md-header__title')).toHaveText('Your title');
    await settings.getByRole('textbox', {name: 'Button 3: Text', exact: true}).fill('Third button');
    await settings.getByRole('switch', {name: 'Button 3', exact: true}).press('Space');
    await expect(header.locator('.g-md-button').nth(2)).toBeHidden();
    await settings.getByRole('switch', {name: 'Button 3', exact: true}).press('Space');
    await expect(header.locator('.g-md-button').nth(2)).toHaveText('Third button');
    await settings.getByRole('button', {name: 'Text color', exact: true}).click();
    await page
        .getByRole('dialog', {name: 'Text color palette', exact: true})
        .getByRole('button', {name: 'Red', exact: true})
        .click();
    await expect(header).toHaveAttribute('data-text', 'red');
    await settings.getByRole('button', {name: 'Background', exact: true}).click();
    await page
        .getByTestId('g-md-header-background')
        .getByRole('button', {name: 'Color', exact: true})
        .click();
    await page
        .getByRole('dialog', {name: 'Color palette', exact: true})
        .getByRole('button', {name: 'Blue', exact: true})
        .click();
    await expect(header).toHaveAttribute('data-fill', 'blue');
    await expect(settings.getByRole('button', {name: 'Background', exact: true})).toContainText(
        'Blue',
    );
    await settings.getByRole('button', {name: 'Close', exact: true}).click();
    await editor.switchMode('markup');
    await expect(page.locator('.cm-content')).toContainText(':::header-title');
    await expect(page.locator('.cm-content')).toContainText(':::button');
    await editor.switchMode('wysiwyg');
    await expect(page.locator('.g-md-button').nth(2)).toHaveText('Third button');
});

test('should keep independent images and hide the content image when centered', async ({
    mount,
    page,
}) => {
    await mount(<HeaderDemo markupKey="designSettings" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByTestId('g-md-header-settings');
    const original = await header.locator('.g-md-header__media img').getAttribute('src');
    await settings
        .getByRole('radiogroup', {name: 'Horizontal'})
        .getByRole('radio', {name: 'Center', exact: true})
        .check();
    await expect(header.locator('.g-md-header__media')).toBeHidden();
    await expect(settings.getByRole('switch', {name: 'Image beside text'})).toBeDisabled();
    await settings
        .getByRole('radiogroup', {name: 'Horizontal'})
        .getByRole('radio', {name: 'Right', exact: true})
        .check();
    await expect(header.locator('.g-md-header__media img')).toHaveAttribute('src', original!);
    await expect(header).toHaveAttribute('data-image', original!);
    await expect(header.locator('.g-md-header__media')).toBeVisible();
});

test('should adapt to a narrow container inside a wide viewport', async ({
    mount,
    page,
    expectScreenshot,
}) => {
    await page.setViewportSize({width: 1440, height: 1200});
    await mount(<HeaderDemo markupKey="design" />, {width: 400});
    const header = page.locator('.g-md-header');
    const media = header.locator('.g-md-header__media');
    const title = header.locator('.g-md-header__title');
    await expect(media).toHaveCSS('position', 'relative');
    const mediaBox = await media.boundingBox();
    const titleBox = await title.boundingBox();
    expect(mediaBox!.y + mediaBox!.height).toBeLessThan(titleBox!.y);
    expect(await header.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await expectScreenshot({component: page.getByTestId('g-md-editor-mode')});
});

test('should edit standalone buttons and preserve their style and target', async ({
    mount,
    page,
    editor,
}) => {
    await mount(<HeaderDemo markupKey="buttons" />, {width: 1100});
    const button = page.locator('.g-md-button').first();
    await button.click();
    const popup = page.getByTestId('g-md-button-settings');
    await popup.getByRole('textbox', {name: 'Button: Text', exact: true}).fill('Read more');
    await popup.getByRole('checkbox', {name: 'New tab', exact: true}).check();
    await popup.getByRole('textbox', {name: 'Button: Link address', exact: true}).fill('/updated');
    await expect(button).toHaveText('Read more');
    await expect(button).toHaveAttribute('target', '_blank');
    await expect(button).toHaveAttribute('rel', 'noopener noreferrer');
    await editor.switchMode('markup');
    await expect(page.locator('.cm-content')).toContainText('new-tab="true"');
    await editor.switchMode('wysiwyg');
    await expect(page.locator('.g-md-button').first()).toHaveAttribute('href', '/updated');
});

test('should copy the agreed containers and undo cover removal', async ({mount, page}) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await mount(<HeaderDemo markupKey="design" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    const toolbar = page.getByTestId('g-md-toolbar-header');
    await toolbar.getByRole('button', {name: 'Copy', exact: true}).click();
    await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toContain(':::header-title');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(':::button');
    await toolbar.getByRole('button', {name: 'Remove', exact: true}).click();
    await expect(header).toHaveCount(0);
    await page.getByRole('button', {name: 'Undo', exact: true}).click();
    await expect(header).toHaveCount(1);
    await expect(header.locator('.g-md-button')).toHaveCount(3);
});

test('should blur only the background and disable shape animation for reduced motion', async ({
    mount,
    page,
    editor,
}) => {
    await page.emulateMedia({reducedMotion: 'reduce'});
    await mount(<HeaderDemo markupKey="backgrounds" />, {width: 1100});
    const blurred = page.locator('.g-md-header[data-effect="blur"]');
    expect(await blurred.evaluate((node) => getComputedStyle(node, '::before').filter)).toBe(
        'blur(12px)',
    );
    await expect(blurred.locator('.g-md-header__title')).toHaveCSS('filter', 'none');
    await expect(page.locator('.g-md-header__shape').first()).toHaveCSS('animation-name', 'none');
    await editor.switchPreview('visible');
    await expect(
        page.getByTestId('demo-md-preview').locator('.g-md-header__shape').first(),
    ).toHaveCSS('animation-name', 'none');
});

test('should edit empty title and description directly', async ({
    mount,
    page,
    expectScreenshot,
}) => {
    await mount(<HeaderDemo markupKey="empty" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.locator('.g-md-header__title').click();
    await page.keyboard.type('My title');
    await header.locator('.header_content p').click();
    await page.keyboard.type('My description');
    await expect(header.locator('.g-md-header__title')).toHaveText('My title');
    await expect(header.locator('.header_content')).toContainText('My description');
    await expectScreenshot({component: page.getByTestId('g-md-editor-mode')});
});

test('should upload a content image independently of the background', async ({mount, page}) => {
    await mount(<HeaderDemo markupKey="empty" />, {width: 1100});
    const chooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', {name: 'Upload content image', exact: true}).click();
    await (await chooserPromise).setFiles('tests/visual-tests/public/assets/test-image.jpg');
    const header = page.locator('.g-md-header');
    await expect(header.locator('.g-md-header__media img')).toBeVisible();
    const contentSrc = await header.locator('.g-md-header__media img').getAttribute('src');
    await expect(header).toHaveAttribute('data-image', '');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    await page
        .getByTestId('g-md-header-settings')
        .getByRole('button', {name: 'Background', exact: true})
        .click();
    const popup = page.getByTestId('g-md-header-background');
    await popup.getByRole('radio', {name: 'Image', exact: true}).check();
    const backgroundChooser = page.waitForEvent('filechooser');
    await popup.getByRole('button', {name: 'Upload image', exact: true}).click();
    await (await backgroundChooser).setFiles('tests/visual-tests/public/assets/test-image.jpg');
    await expect(header).not.toHaveAttribute('data-image', '');
    await expect(header.locator('.g-md-header__media img')).toHaveAttribute('src', contentSrc!);
});

test('should insert a cover from the main toolbar', async ({mount, page}) => {
    await mount(<HeaderDemo markupKey="buttons" />, {width: 1100});
    await page.getByRole('button', {name: 'Cover', exact: true}).click();
    await expect(page.locator('.g-md-header')).toHaveCount(1);
    await expect(page.locator('.g-md-header')).toHaveAttribute('data-height', 's');
    await expect(page.locator('.g-md-header .g-md-button')).toHaveCount(1);
    await page.keyboard.type('Inserted cover');
    await expect(page.locator('.g-md-header__title')).toHaveText('Inserted cover');
});
