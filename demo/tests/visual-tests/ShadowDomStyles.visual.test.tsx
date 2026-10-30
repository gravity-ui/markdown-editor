import type {Locator} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {ShadowDomStyles} from './ShadowDomStyles.helpers';

const readVariable = (locator: Locator, name: string) =>
    locator.evaluate(
        (element, variable) => getComputedStyle(element).getPropertyValue(variable),
        name,
    );

test.describe('Shadow DOM styles', () => {
    test('should apply the editor CSS inside the shadow root', async ({mount, page}) => {
        await mount(<ShadowDomStyles />);
        const host = page.getByTestId('shadow-host');
        const editor = page.locator('.g-md-editor-component');

        await expect(editor).toBeVisible();
        expect(
            await editor.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
        ).toBe(true);
        await expect(editor).toHaveCSS('display', 'flex');
        await expect(page.locator('.g-md-toolbar').first()).toHaveCSS('display', 'flex');
        expect(await readVariable(page.locator('.yfm').first(), '--yfm-color-text')).not.toBe('');
        expect(await readVariable(host, '--toolbar-item-preview-width')).toBe('144px');
        expect(await readVariable(host, '--yfm-colorify-violet')).toBe('#f0f');
    });

    test('should render table popups in the portal container of the shadow root', async ({
        mount,
        page,
    }) => {
        await mount(<ShadowDomStyles />);
        await page.locator('.ProseMirror td').first().click();
        const popup = page.locator('.g-md-yfm-table-floating-popup').first();

        await expect(popup).toBeAttached();
        expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
            true,
        );
        await expect(popup).toHaveCSS('position', 'relative');
    });

    test('should leave the shadow root unstyled without the stylesheet', async ({mount, page}) => {
        await mount(<ShadowDomStyles adoptStyles={false} />);
        const editor = page.locator('.g-md-editor-component');

        await expect(editor).toBeVisible();
        await expect(editor).toHaveCSS('display', 'block');
        expect(await readVariable(page.locator('.yfm').first(), '--yfm-color-text')).toBe('');
        expect(
            await readVariable(page.getByTestId('shadow-host'), '--toolbar-item-preview-width'),
        ).toBe('');
    });
});
