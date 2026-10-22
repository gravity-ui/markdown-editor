import type {Locator} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {HeaderDemo} from '../../../src/stories/examples/header/Header';

const textColors = (scope: Locator) =>
    scope
        .locator('.yfm-colorify')
        .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).color));

test('should keep image text themes independent when the editor theme changes', async ({
    mount,
    page,
    expectScreenshot,
}) => {
    await page.emulateMedia({colorScheme: 'light'});
    await page.setViewportSize({width: 1440, height: 1800});
    await mount(<HeaderDemo markupKey="imageThemes" />, {width: 1100});
    const headers = page.locator('.g-md-header');
    await expect(headers).toHaveCount(3);
    const system = headers.nth(0);
    const light = headers.nth(1);
    const dark = headers.nth(2);
    const lightColors = await textColors(light);
    const darkColors = await textColors(dark);
    expect(lightColors).toHaveLength(7);
    expect(darkColors).not.toEqual(lightColors);
    expect(await textColors(system)).toEqual(lightColors);
    const lightLink = await light
        .locator('.header_content a')
        .evaluate((node) => getComputedStyle(node).color);
    const darkLink = await dark
        .locator('.header_content a')
        .evaluate((node) => getComputedStyle(node).color);
    await expect(light.locator('.g-md-header__content')).toHaveCSS(
        'background-color',
        'rgba(0, 0, 0, 0)',
    );
    await expect(dark.locator('.g-md-header__content')).toHaveCSS(
        'background-color',
        'rgba(0, 0, 0, 0)',
    );
    await expectScreenshot({component: page.getByTestId('g-md-editor-mode'), themes: ['light']});

    await page.emulateMedia({colorScheme: 'dark'});
    await expect(page.locator('body')).toHaveClass(/g-root_theme_dark/);
    expect(await textColors(system)).toEqual(darkColors);
    expect(await textColors(light)).toEqual(lightColors);
    expect(await textColors(dark)).toEqual(darkColors);
    await expect(light.locator('.header_content a')).toHaveCSS('color', lightLink);
    await expect(dark.locator('.header_content a')).toHaveCSS('color', darkLink);
    await expectScreenshot({component: page.getByTestId('g-md-editor-mode'), themes: ['dark']});
});

test('should preserve image text themes in sanitized preview and after switching modes', async ({
    mount,
    page,
    editor,
}) => {
    await page.emulateMedia({colorScheme: 'light'});
    await mount(<HeaderDemo markupKey="imageThemes" />, {width: 1100});
    const wysiwyg = page.locator('.g-md-header');
    const expected = await Promise.all([0, 1, 2].map((index) => textColors(wysiwyg.nth(index))));
    const buttons = (scope: Locator) =>
        scope.locator('.g-md-button').evaluateAll((nodes) =>
            nodes.map((node) => ({
                color: getComputedStyle(node).color,
                background: getComputedStyle(node).backgroundColor,
            })),
        );
    const expectedButtons = await Promise.all(
        [0, 1, 2].map((index) => buttons(wysiwyg.nth(index))),
    );
    await editor.switchPreview('visible');
    const preview = page.getByTestId('demo-md-preview').locator('.g-md-header');
    await expect(preview).toHaveCount(3);
    for (const index of [0, 1, 2]) {
        expect(await textColors(preview.nth(index))).toEqual(expected[index]);
        expect(await buttons(preview.nth(index))).toEqual(expectedButtons[index]);
    }
    await page.emulateMedia({colorScheme: 'dark'});
    await expect(page.locator('body')).toHaveClass(/g-root_theme_dark/);
    expect(await textColors(preview.nth(1))).toEqual(expected[1]);
    expect(await textColors(preview.nth(2))).toEqual(expected[2]);
    await editor.switchMode('wysiwyg');
    await expect(page.locator('.g-md-header')).toHaveCount(3);
    expect(await textColors(page.locator('.g-md-header').nth(1))).toEqual(expected[1]);
    expect(await textColors(page.locator('.g-md-header').nth(2))).toEqual(expected[2]);
});

test('should change the image text theme from settings and retain it while the image is disabled', async ({
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
    const settings = page.getByRole('dialog', {name: 'Block settings', exact: true});
    await settings.getByRole('combobox', {name: 'Theme', exact: true}).click();
    await page.getByRole('option', {name: 'Dark', exact: true}).click();
    await expect(header.locator('.g-md-header__content')).toHaveClass(/g-root_theme_dark/);
    await expect(header).toHaveAttribute('data-bg-image-theme', 'dark');
    await settings.getByRole('button', {name: 'Background', exact: true}).click();
    await page
        .getByTestId('g-md-header-background')
        .getByRole('button', {name: 'Remove background image', exact: true})
        .click();
    await expect(header.locator('.g-md-header__content')).not.toHaveClass(/g-root_theme_dark/);
    await expect(header).toHaveAttribute('data-bg-image-theme', 'dark');
});
