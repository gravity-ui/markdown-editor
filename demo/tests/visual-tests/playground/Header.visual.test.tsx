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
    await settings.getByRole('button', {name: 'Color', exact: true}).click();
    await page
        .getByRole('dialog', {name: 'Color palette', exact: true})
        .getByRole('button', {name: 'Red', exact: true})
        .click();
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

for (const theme of ['light', 'dark'] as const) {
    test(`should render every block setting in the ${theme} theme`, async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await page.emulateMedia({colorScheme: theme});
        await page.setViewportSize({width: 1440, height: 1600});
        await mount(<HeaderDemo markupKey="designSettings" />, {width: 1100});
        await page.locator('.g-md-header').hover();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Block settings'})
            .click();
        const settings = page.getByRole('dialog', {name: 'Block settings'});
        await expect(settings).toHaveCSS('width', '320px');
        await expect(settings.locator('.g-md-header-settings__row').first()).toHaveCSS(
            'grid-template-columns',
            '120px 158px',
        );
        await expect(settings.getByRole('combobox')).toHaveCount(4);
        await expect(settings.getByRole('combobox', {name: 'Theme', exact: true})).toHaveText(
            'System',
        );
        await expect(settings.locator('.g-md-header-color__swatch')).toHaveCount(2);
        await expect(settings.getByRole('switch')).toHaveCount(7);
        await expect(
            settings.getByRole('combobox', {name: 'Button 1: Link', exact: true}),
        ).toHaveText('Other page');
        await expect(
            settings.getByRole('button', {
                name: 'File: abstract-dark-blue-black-gradients.png',
                exact: true,
            }),
        ).toBeVisible();
        await expectScreenshot({component: settings, themes: [theme]});
        for (const name of ['Block text', 'Buttons', 'Background and image']) {
            await settings.getByRole('button', {name, exact: true}).click();
            await expect(settings.getByRole('button', {name, exact: true})).toHaveAttribute(
                'aria-expanded',
                'false',
            );
        }
        await expect(settings.getByRole('switch')).toHaveCount(1);
        await expectScreenshot({component: settings, themes: [theme], nameSuffix: 'collapsed'});
    });
}

test('should apply every layout and text setting', async ({mount, page}) => {
    await page.setViewportSize({width: 1440, height: 1600});
    await mount(<HeaderDemo markupKey="designSettings" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByRole('dialog', {name: 'Block settings'});
    for (const [size, value] of [
        ['S', 'small'],
        ['M', 'medium'],
        ['L', 'large'],
    ]) {
        await settings.getByRole('radio', {name: size, exact: true}).check();
        await expect(header).toHaveAttribute('data-format', value);
    }
    await settings.getByRole('switch', {name: 'Fixed width', exact: true}).press('Space');
    await expect(header).toHaveAttribute('data-fixed', 'false');
    await settings
        .getByRole('radiogroup', {name: 'Vertical', exact: true})
        .getByRole('radio', {name: 'Bottom', exact: true})
        .check();
    await expect(header).toHaveCSS('align-items', 'flex-end');
    await settings
        .getByRole('radiogroup', {name: 'Horizontal', exact: true})
        .getByRole('radio', {name: 'Right', exact: true})
        .check();
    await expect(header).toHaveCSS('text-align', 'right');
    for (const [label, selector] of [
        ['Title', '.g-md-header__title'],
        ['Description', '.header_content'],
    ]) {
        await settings.getByRole('switch', {name: label, exact: true}).press('Space');
        await expect(header.locator(selector)).toBeHidden();
        await settings.getByRole('switch', {name: label, exact: true}).press('Space');
        await expect(header.locator(selector)).toBeVisible();
    }
    await settings.getByRole('button', {name: 'Text color', exact: true}).click();
    await page
        .getByRole('dialog', {name: 'Text color palette', exact: true})
        .getByRole('button', {name: 'Red', exact: true})
        .click();
    await expect(header).toHaveAttribute('data-text', 'red');
});

test('should preserve independent button slots and their settings when toggled', async ({
    mount,
    page,
}) => {
    await page.setViewportSize({width: 1440, height: 1600});
    await mount(<HeaderDemo markupKey="designSettings" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByRole('dialog', {name: 'Block settings'});
    await settings.getByRole('switch', {name: 'Button 3', exact: true}).press('Space');
    await settings.getByRole('textbox', {name: 'Button 3: Text', exact: true}).fill('Third');
    await settings
        .getByRole('textbox', {name: 'Button 3: Link address', exact: true})
        .fill('/third');
    await settings.getByRole('combobox', {name: 'Button 3: Style', exact: true}).click();
    await page.getByRole('option', {name: 'Flat', exact: true}).click();
    await settings.getByRole('switch', {name: 'Button 1', exact: true}).press('Space');
    await expect(header.locator('.g-md-header__action:visible')).toHaveText(['Third']);
    await settings.getByRole('switch', {name: 'Button 3', exact: true}).press('Space');
    await expect(header.locator('.header_actions')).toBeHidden();
    await settings.getByRole('switch', {name: 'Button 3', exact: true}).press('Space');
    await expect(settings.getByRole('textbox', {name: 'Button 3: Text', exact: true})).toHaveValue(
        'Third',
    );
    await expect(header.locator('.g-md-header__action:visible')).toHaveAttribute('href', '/third');
    await expect(header.locator('.g-md-header__action:visible')).toHaveAttribute(
        'data-type',
        'link',
    );
    await settings.getByRole('switch', {name: 'Button 1', exact: true}).press('Space');
    await expect(header.locator('.g-md-header__action:visible')).toHaveText(['Button', 'Third']);
    await expect(settings.getByRole('switch', {name: 'Button 2', exact: true})).not.toBeChecked();
    await settings.getByRole('switch', {name: 'Button 2', exact: true}).press('Space');
    await expect(header.locator('.g-md-header__action:visible')).toHaveText([
        'Button',
        'Button',
        'Third',
    ]);
});

test('should toggle, position, replace and remove the image', async ({mount, page}) => {
    await page.setViewportSize({width: 1440, height: 1600});
    await mount(<HeaderDemo markupKey="designSettings" />, {width: 1100});
    const header = page.locator('.g-md-header');
    await header.hover();
    await page
        .getByTestId('g-md-toolbar-header')
        .getByRole('button', {name: 'Block settings'})
        .click();
    const settings = page.getByRole('dialog', {name: 'Block settings'});
    for (const [label, layer] of [
        ['Left half', 'left'],
        ['Right half', 'right'],
        ['Full width', 'full'],
    ]) {
        await settings.getByRole('combobox', {name: 'Placement', exact: true}).click();
        await page.getByRole('option', {name: label, exact: true}).click();
        await expect(header).toHaveAttribute('data-layer', layer);
    }
    const image = await header.getAttribute('data-image');
    if (!image) throw new Error('Cover image is missing');
    await settings.getByRole('switch', {name: 'Image', exact: true}).press('Space');
    await expect(header).toHaveAttribute('data-image-enabled', 'false');
    await expect(header).not.toHaveAttribute('style', /--g-md-header-image:/);
    await settings.getByRole('switch', {name: 'Image', exact: true}).press('Space');
    await expect(header).toHaveAttribute('data-image', image);
    await expect(header).toHaveAttribute('style', /--g-md-header-image:/);
    const chooserPromise = page.waitForEvent('filechooser');
    await settings.getByRole('button', {name: /^File:/}).click();
    await (
        await chooserPromise
    ).setFiles({
        name: 'new-cover.svg',
        mimeType: 'image/svg+xml',
        buffer: Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="blue"/></svg>',
        ),
    });
    await expect(
        settings.getByRole('button', {name: 'File: new-cover.svg', exact: true}),
    ).toBeVisible();
    await expect(header).toHaveAttribute('data-image-name', 'new-cover.svg');
    await settings.getByRole('button', {name: 'Remove image', exact: true}).click();
    await expect(header).not.toHaveAttribute('data-image');
    await expect(settings.getByRole('button', {name: 'Upload image', exact: true})).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
    test(`should use standard text palettes and live theme colors in the ${theme} theme`, async ({
        mount,
        page,
        expectScreenshot,
    }) => {
        await page.emulateMedia({colorScheme: theme});
        await page.setViewportSize({width: 1440, height: 1600});
        await mount(<HeaderDemo markupKey="designSettings" />, {width: 1100});
        const header = page.locator('.g-md-header');
        await header.hover();
        await page
            .getByTestId('g-md-toolbar-header')
            .getByRole('button', {name: 'Block settings'})
            .click();
        const settings = page.getByRole('dialog', {name: 'Block settings', exact: true});
        await settings.getByRole('button', {name: 'Text color', exact: true}).click();
        const textPalette = page.getByRole('dialog', {name: 'Text color palette', exact: true});
        await expect(textPalette.getByRole('button')).toHaveCount(8);
        await expect(textPalette.getByRole('button', {name: 'Blue', exact: true})).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        await page.mouse.move(1400, 1500);
        await expectScreenshot({component: textPalette, themes: [theme], nameSuffix: 'text'});
        await textPalette.getByRole('button', {name: 'No color', exact: true}).press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Space');
        await expect(textPalette).toHaveCount(0);
        await expect(header).toHaveAttribute('data-text', 'red');
        const textColor = await header.evaluate((element) => {
            const probe = document.createElement('span');
            probe.style.color = 'var(--g-color-text-danger)';
            element.append(probe);
            const value = getComputedStyle(probe).color;
            probe.remove();
            return value;
        });
        await expect(header.locator('.g-md-header__title')).toHaveCSS('color', textColor);
        const themeOverride = await page.addStyleTag({
            content:
                '.g-root {--g-color-text-danger: rgb(11, 22, 33); --g-color-base-info-medium: rgb(44, 55, 66);}',
        });
        await expect(header.locator('.g-md-header__title')).toHaveCSS('color', 'rgb(11, 22, 33)');
        await expect(
            settings
                .getByRole('button', {name: 'Text color', exact: true})
                .locator('.g-md-header-color__swatch'),
        ).toHaveCSS('background-color', 'rgb(11, 22, 33)');
        await settings.getByRole('button', {name: 'Text color', exact: true}).click();
        await expect(textPalette.getByRole('button', {name: 'Red', exact: true})).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        await textPalette.getByRole('button', {name: 'No color', exact: true}).click();
        await expect(header).toHaveAttribute('data-text', 'auto');
        await settings.getByRole('button', {name: 'Color', exact: true}).click();
        const fillPalette = page.getByRole('dialog', {name: 'Color palette', exact: true});
        await expect(fillPalette.getByRole('button')).toHaveCount(12);
        await fillPalette.getByRole('button', {name: 'Blue', exact: true}).click();
        await expect(header).toHaveAttribute('data-fill', 'blue');
        await expect(header).toHaveCSS('background-color', 'rgb(44, 55, 66)');
        await expect(
            settings
                .getByRole('button', {name: 'Color', exact: true})
                .locator('.g-md-header-color__swatch'),
        ).toHaveCSS('background-color', 'rgb(44, 55, 66)');
        await themeOverride.evaluate((element) => element.parentNode?.removeChild(element));
        await expect(header).not.toHaveCSS('background-color', 'rgb(44, 55, 66)');
        await settings.getByRole('button', {name: 'Color', exact: true}).click();
        await expect(fillPalette.getByRole('button', {name: 'Blue', exact: true})).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        await page.mouse.move(1400, 1500);
        await expectScreenshot({component: fillPalette, themes: [theme], nameSuffix: 'background'});
        await fillPalette.getByRole('button', {name: 'No color', exact: true}).click();
        await expect(header).toHaveAttribute('data-bg', 'surface');
    });
}
