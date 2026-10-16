import {expect, test} from 'playwright/core';

import {HeaderDemo} from '../../../src/stories/examples/header/Header';

for (const theme of ['light', 'dark'] as const) {
    test(`should show three actions on hover in the ${theme} theme`, async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await page.emulateMedia({colorScheme: theme});
        await page.setViewportSize({width: 1200, height: 900});
        await mount(<HeaderDemo markupKey="design" />, {width: 1100});
        await page.mouse.move(1190, 850);
        const toolbar = page.getByTestId('g-md-toolbar-header');
        await expect(toolbar).toHaveCount(0);
        await page.locator('.g-md-header').hover();
        await expect(toolbar.getByRole('button')).toHaveCount(3);
        await expect(toolbar.getByRole('button').nth(0)).toHaveAccessibleName('Block settings');
        await expect(toolbar.getByRole('button').nth(1)).toHaveAccessibleName('Copy');
        await expect(toolbar.getByRole('button').nth(2)).toHaveAccessibleName('Remove');
        const popup = page.locator('.g-md-header-toolbar__popup');
        await expect(popup).toHaveCSS('width', '126px');
        await expect(popup).toHaveCSS('height', '36px');
        await expectScreenshot({component: popup, themes: [theme]});
        await page.mouse.move(1190, 850);
        await expect(toolbar).toHaveCount(0);
    });
}

test('should copy the entire cover and support undo after removal', async ({mount, page}) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await mount(<HeaderDemo markupKey="design" />);
    const header = page.locator('.g-md-header');
    await header.hover();
    const toolbar = page.getByTestId('g-md-toolbar-header');
    await toolbar.getByRole('button', {name: 'Copy', exact: true}).click();
    await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toContain('Your title');
    const html = await page.evaluate(async () => {
        const items = await navigator.clipboard.read();
        return (await items[0].getType('text/html')).text();
    });
    expect(html).toContain('g-md-header');
    expect(html).toContain('data-layer="right"');
    await expect(header).toHaveCount(1);
    await toolbar.getByRole('button', {name: 'Remove', exact: true}).click();
    await expect(header).toHaveCount(0);
    await page.getByRole('button', {name: 'Undo', exact: true}).click();
    await expect(header).toHaveCount(1);
    await expect(header.locator('.g-md-header__action')).toHaveCount(3);
});

test('should keep settings open while changing the cover', async ({
    mount,
    page,
    expectScreenshot,
}) => {
    await page.emulateMedia({colorScheme: 'dark'});
    await page.setViewportSize({width: 1200, height: 900});
    await mount(<HeaderDemo markupKey="design" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByRole('dialog', {name: 'Block settings'});
    await settings.getByRole('radio', {name: 'L', exact: true}).check();
    await expect(header).toHaveAttribute('data-format', 'large');
    await settings.getByRole('switch', {name: 'Title', exact: true}).press('Space');
    await expect(header.locator('.g-md-header__title')).toBeHidden();
    await settings.getByRole('switch', {name: 'Title', exact: true}).press('Space');
    await expect(header.locator('.g-md-header__title')).toHaveText('Your title');
    await settings.getByRole('textbox', {name: 'Button 1: Text', exact: true}).fill('Read more');
    await expect(header.locator('.g-md-header__action').first()).toHaveText('Read more');
    await expectScreenshot({component: settings, themes: ['dark']});
    await settings.getByRole('button', {name: 'Close', exact: true}).click();
    await expect(settings).toHaveCount(0);
});

test('should change colors from block settings', async ({mount, page}) => {
    await mount(<HeaderDemo markupKey="design" />);
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByRole('dialog', {name: 'Block settings'});
    await settings.getByRole('combobox', {name: 'Color', exact: true}).click();
    await page.getByRole('option', {name: 'Red', exact: true}).click();
    await expect(header).toHaveAttribute('data-fill', 'red');
});

test('should render the redesigned cover with its hover toolbar', async ({
    mount,
    page,
    expectScreenshot,
}) => {
    await page.emulateMedia({colorScheme: 'dark'});
    await page.setViewportSize({width: 1200, height: 900});
    await mount(<HeaderDemo markupKey="design" />, {
        width: 1100,
        styles: '.playground__editor {padding-bottom: 48px;}',
    });
    const header = page.locator('.g-md-header');
    await expect(header.locator('.g-md-header__action')).toHaveCount(3);
    const image = await header.evaluate(
        (element) => getComputedStyle(element, '::after').backgroundImage,
    );
    const imageUrl = /url\("([^"]+)"\)/.exec(image)?.[1];
    if (!imageUrl) throw new Error('Cover image URL is missing');
    expect((await page.request.get(imageUrl)).ok()).toBe(true);
    await header.hover();
    await expect(page.getByTestId('g-md-toolbar-header')).toBeVisible();
    await expectScreenshot({component: page.locator('.playground__editor'), themes: ['dark']});
});

test('should render three cover sizes', async ({mount, page, expectScreenshot}) => {
    await page.setViewportSize({width: 1200, height: 1400});
    await mount(<HeaderDemo markupKey="designSizes" />, {width: 1100});
    await expectScreenshot();
});

test('should render images beside and behind the text', async ({mount, page, expectScreenshot}) => {
    await page.setViewportSize({width: 1200, height: 1400});
    await mount(<HeaderDemo markupKey="designLayouts" />, {width: 1100});
    await expectScreenshot();
});

test('should stack the image below the text on narrow screens', async ({mount, page}) => {
    await page.setViewportSize({width: 400, height: 900});
    await mount(<HeaderDemo markupKey="design" />, {width: 340});
    await expect(page.locator('.g-md-header')).toHaveCSS('flex-direction', 'column');
});
