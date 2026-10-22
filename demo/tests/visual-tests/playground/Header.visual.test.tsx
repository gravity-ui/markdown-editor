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
        await expect
            .poll(async () => {
                const settingsBox = await settings.boundingBox();
                const headerBox = await header.boundingBox();
                return Math.abs(settingsBox!.x - headerBox!.x - headerBox!.width - 12);
            })
            .toBeLessThan(0.5);
        const settingsBox = await settings.boundingBox();
        const headerBox = await header.boundingBox();
        expect(settingsBox!.y).toBeCloseTo(headerBox!.y, 0);
        await expect(settings).toHaveCSS('width', '320px');
        await expectScreenshot({component: settings, themes: [theme], nameSuffix: 'settings'});
        await settings.getByRole('combobox', {name: 'Width', exact: true}).click();
        await page.getByRole('option', {name: 'S', exact: true}).click();
        await expect
            .poll(async () => {
                const panel = await settings.boundingBox();
                const cover = await header.boundingBox();
                return Math.abs(panel!.x - cover!.x - cover!.width - 12);
            })
            .toBeLessThan(0.5);
        await page.setViewportSize({width: 900, height: 800});
        await expect
            .poll(async () => {
                const panel = await settings.boundingBox();
                return (
                    panel!.x >= 15 &&
                    panel!.x + panel!.width <= 885 &&
                    panel!.y >= 15 &&
                    panel!.y + panel!.height <= 785
                );
            })
            .toBe(true);
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
    await settings.getByRole('combobox', {name: 'Text color', exact: true}).click();
    await page.getByRole('option', {name: 'Red', exact: true}).click();
    await expect(header).toHaveAttribute('data-text', 'red');
    await settings.getByRole('button', {name: 'Background', exact: true}).click();
    await page
        .getByRole('group', {name: 'Color palette', exact: true})
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
    const mediaBox = await header.locator('.g-md-header__media').boundingBox();
    const imageBox = await header.locator('.g-md-header__media img').boundingBox();
    expect(imageBox!.x).toBeCloseTo(mediaBox!.x, 0);
    expect(imageBox!.y).toBeCloseTo(mediaBox!.y, 0);
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
    await popup.getByRole('tab', {name: 'Image', exact: true}).click();
    const backgroundChooser = page.waitForEvent('filechooser');
    await popup.getByRole('button', {name: 'Upload image', exact: true}).click();
    await (await backgroundChooser).setFiles('tests/visual-tests/public/assets/test-image.jpg');
    await expect(header).not.toHaveAttribute('data-image', '');
    await expect(header.locator('.g-md-header__media img')).toHaveAttribute('src', contentSrc!);
    await page.keyboard.press('Escape');
    const settings = page.getByTestId('g-md-header-settings');
    await settings
        .getByRole('radiogroup', {name: 'Horizontal'})
        .getByRole('radio', {name: 'Right', exact: true})
        .check();
    await expect
        .poll(() =>
            header
                .locator('.g-md-header__media img')
                .evaluate((node: HTMLImageElement) => node.naturalWidth),
        )
        .toBeGreaterThan(0);
    const mediaBox = await header.locator('.g-md-header__media').boundingBox();
    const imageBox = await header.locator('.g-md-header__media img').boundingBox();
    expect(imageBox!.x).toBeCloseTo(mediaBox!.x, 0);
    expect(imageBox!.y).toBeCloseTo(mediaBox!.y, 0);
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

test('should preview the background in both themes and honor a fixed text theme', async ({
    mount,
    page,
    expectScreenshot,
}) => {
    await page.setViewportSize({width: 1440, height: 1100});
    await mount(<HeaderDemo markupKey="designSettings" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByTestId('g-md-header-settings');
    await settings.getByRole('button', {name: 'Background', exact: true}).click();
    const popup = page.getByTestId('g-md-header-background');
    const previews = popup.locator('.g-md-header-settings__background-preview');
    const text = popup.locator('.g-md-header-settings__preview-text');
    await expect(previews).toHaveCount(2);
    await expect(popup.getByText('Light theme', {exact: true})).toBeVisible();
    await expect(popup.getByText('Dark theme', {exact: true})).toBeVisible();
    const colors = await text.evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node).color),
    );
    expect(colors[0]).not.toBe(colors[1]);
    const images = await previews.evaluateAll((nodes) =>
        nodes.map((node) => getComputedStyle(node, '::before').backgroundImage),
    );
    expect(images[0]).toContain(await header.getAttribute('data-image'));
    expect(images[0]).toBe(images[1]);
    await expectScreenshot({component: popup, nameSuffix: 'system'});
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(settings).toBeVisible();
    await settings.getByRole('combobox', {name: 'Theme', exact: true}).click();
    await page.getByRole('option', {name: 'Dark', exact: true}).click();
    await settings.getByRole('button', {name: 'Background', exact: true}).click();
    await expect(text.nth(0)).toHaveCSS('color', colors[1]);
    await expect(text.nth(1)).toHaveCSS('color', colors[1]);
    await expectScreenshot({component: popup, nameSuffix: 'fixed'});
});

test('should edit title size and color independently and preserve them in preview', async ({
    mount,
    page,
    editor,
    expectScreenshot,
}) => {
    await mount(<HeaderDemo markupKey="design" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByTestId('g-md-header-settings');
    await settings.getByRole('combobox', {name: 'Title size', exact: true}).click();
    await page.getByRole('option', {name: '1', exact: true}).click();
    await settings.getByRole('combobox', {name: 'Title color', exact: true}).click();
    await expectScreenshot({component: page.getByRole('listbox'), nameSuffix: 'title-colors'});
    await page.getByRole('option', {name: 'Red', exact: true}).click();
    const title = header.locator('.g-md-header__title');
    await expect(title).toHaveCSS('font-size', '32px');
    await expect(title).toHaveAttribute('data-size', '1');
    await expect(title).toHaveAttribute('data-color', 'red');
    await expect(header).toHaveAttribute('data-text', 'auto');
    const color = await title.evaluate((node) => getComputedStyle(node).color);
    await settings.getByRole('button', {name: 'Close', exact: true}).click();
    await editor.switchMode('markup');
    await expect(page.locator('.cm-content')).toContainText(
        ':::header-title{size="1" color="red"}',
    );
    await editor.switchMode('wysiwyg');
    await editor.switchPreview('visible');
    const preview = page.getByTestId('demo-md-preview').locator('.g-md-header__title');
    await expect(preview).toHaveCSS('font-size', '32px');
    await expect(preview).toHaveCSS('color', color);
});

test('should change description headings from the standard selection menu and preserve them', async ({
    mount,
    page,
    editor,
}) => {
    await mount(<HeaderDemo markupKey="design" />, {width: 1100});
    const content = page.locator('.g-md-header .header_content');
    for (const level of [1, 2, 3, 4, 5, 6]) {
        await editor.focus();
        await editor.press('ArrowRight');
        await expect(page.locator('.playground__pm-selection')).toContainText('CursorSelection');
        await editor.selectTextIn('.header_content :is(p, h1, h2, h3, h4, h5, h6)');
        await page
            .getByTestId('g-md-toolbar-selection')
            .getByTestId('g-md-toolbar-text-select')
            .click();
        await page.getByRole('option', {name: `Heading ${level}`, exact: true}).click();
        await expect(content.locator(`h${level}`)).toHaveCount(1);
        await expect(content).toContainText('A short description of the page');
        await expect(page.getByTestId('g-md-toolbar-selection')).toBeHidden();
    }
    await expect(content.locator('h6')).toHaveCSS('font-size', '13px');
    await editor.switchMode('markup');
    await expect(page.locator('.cm-content')).toContainText('###### A short description');
    await editor.switchMode('wysiwyg');
    await editor.switchPreview('visible');
    await expect(page.getByTestId('demo-md-preview').locator('.header_content h6')).toHaveCount(1);
    await editor.switchMode('wysiwyg');
    await editor.selectTextIn('.header_content h6');
    await page
        .getByTestId('g-md-toolbar-selection')
        .getByTestId('g-md-toolbar-text-select')
        .click();
    await page.getByRole('option', {name: 'Text', exact: true}).click();
    await expect(content.locator('p')).toHaveCount(1);
    await expect(content.locator('h6')).toHaveCount(0);
});

test('should offer title sizes and colors when its text is selected', async ({
    mount,
    page,
    editor,
    expectScreenshot,
}) => {
    await mount(<HeaderDemo markupKey="design" />, {width: 1100});
    await editor.selectTextIn('.g-md-header__title');
    const toolbar = page.getByTestId('g-md-toolbar-header-title');
    await expect(toolbar).toBeVisible();
    await expect(page.getByTestId('g-md-toolbar-selection')).toHaveCount(0);
    await toolbar.getByRole('combobox', {name: 'Title size', exact: true}).click();
    await page.getByRole('option', {name: 'Heading 1', exact: true}).click();
    const title = page.locator('.g-md-header__title');
    await expect(title).toHaveCSS('font-size', '32px');
    await expect(title).toHaveText('Your title');
    await toolbar.getByRole('combobox', {name: 'Title color', exact: true}).click();
    await page.getByRole('option', {name: 'Red', exact: true}).click();
    await expect(title).toHaveAttribute('data-color', 'red');
    await expectScreenshot({component: toolbar});
    await title.click();
    await page.keyboard.press('Control+Alt+3');
    await expect(title).toHaveAttribute('data-size', '3');
    await expect(title).toHaveCSS('font-size', '20px');
    await editor.switchMode('markup');
    await expect(page.locator('.cm-content')).toContainText(
        ':::header-title{size="3" color="red"}',
    );
    await editor.switchMode('wysiwyg');
    await expect(title).toHaveAttribute('data-size', '3');
    await expect(title).toHaveAttribute('data-color', 'red');
});
