import type {Locator, Page} from '@playwright/test';

import {expect, test} from 'playwright/core';

import {HtmlConstructorFixture} from './YfmHtmlConstructor.helpers';

const blockContent = (page: Page) => page.locator('.g-md-yfm-html-constructor__item-content');
const heading = (page: Page) => blockContent(page).locator('.card-heading');

const capture = async (page: Page, name: string) => {
    await page.screenshot({path: test.info().outputPath(`${name}.png`), animations: 'disabled'});
};

const openBlockPicker = async (page: Page, appearance?: string) => {
    await page.getByRole('button', {name: 'Insert constructor', exact: true}).click();
    if (appearance) await capture(page, `${appearance}-initial`);
    await page
        .locator('.g-md-yfm-html-constructor__initial')
        .getByRole('button', {name: 'Add block', exact: true})
        .click();
    if (appearance) {
        await expect(page.getByRole('button', {name: 'Test card', exact: true})).toBeVisible();
        await capture(page, `${appearance}-picker`);
    }
};

const addBlock = async (page: Page, appearance?: string) => {
    await openBlockPicker(page, appearance);
    await page.getByRole('button', {name: 'Test card', exact: true}).click();
    await expect(heading(page)).toHaveText('Alpha beta');
};

const openCodeEditor = async (page: Page) => {
    const button = page.getByRole('button', {name: 'Structure settings', exact: true});
    await button.focus();
    await button.press('Enter');
    const input = page.getByRole('textbox', {name: 'HTML', exact: true});
    await expect(input).toBeVisible();
    return input;
};

const expectInsideViewport = async (page: Page, locator: Locator) => {
    const bounds = await locator.boundingBox();
    const viewport = page.viewportSize();
    if (!bounds || !viewport) throw new Error('Expected visible content and a fixed viewport');
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
};

test.describe('HTML Constructor', () => {
    test('keeps light and dark palette values independent', async ({mount, page}) => {
        await mount(<HtmlConstructorFixture />);
        await addBlock(page);
        const toolbar = page.locator('.g-md-yfm-html-constructor__floating-toolbar').first();
        const background = toolbar.getByRole('button', {name: 'Background color', exact: true});
        await background.focus();
        await background.press('Enter');
        await page.getByRole('button', {name: 'Red', exact: true}).click();
        await page.getByRole('button', {name: 'Dark', exact: true}).click();
        await page.getByRole('button', {name: 'Blue', exact: true}).click();

        const structure = page.locator('.g-md-yfm-html-constructor__structure');
        await expect(structure).toHaveCSS('--g-md-hc-background-light', '#d64545');
        await expect(structure).toHaveCSS('--g-md-hc-background-dark', '#2f6fe0');
        await page.getByRole('button', {name: 'Reset', exact: true}).click();
        expect(
            await structure.evaluate((element) =>
                (element as HTMLElement).style.getPropertyValue('--g-md-hc-background-dark'),
            ),
        ).toBe('');
        await expect(structure).toHaveCSS('--g-md-hc-background-light', '#d64545');
        await page.keyboard.press('Escape');
        await expect(
            page.locator('.g-md-yfm-html-constructor__floating-menu_colors'),
        ).not.toBeVisible();

        const textColor = toolbar.getByRole('button', {name: 'Text color', exact: true});
        await textColor.focus();
        await textColor.press('Enter');
        await page.getByRole('button', {name: 'Blue', exact: true}).click();
        await expect(structure).toHaveCSS('--g-md-hc-text-color-dark', '#2f6fe0');
        await expect(heading(page)).toHaveText('Alpha beta');
    });

    test('preserves a custom structure draft when replacement is cancelled', async ({
        mount,
        page,
    }) => {
        await mount(<HtmlConstructorFixture />);
        await addBlock(page);
        const templates = page.getByRole('button', {name: 'Structure templates', exact: true});
        await templates.focus();
        await templates.press('Enter');
        await page.getByRole('button', {name: 'Custom structure', exact: true}).click();
        const input = page.getByRole('textbox', {name: 'HTML', exact: true});
        await input.fill('<h2>Custom draft</h2>');
        await page.getByRole('button', {name: 'Insert', exact: true}).click();
        const confirmation = page
            .getByRole('dialog')
            .filter({has: page.getByText('Replace content?', {exact: true})});
        await confirmation.getByRole('button', {name: 'Cancel', exact: true}).click();
        await expect(input).toHaveValue('<h2>Custom draft</h2>');
        await expect(heading(page)).toHaveText('Alpha beta');
        await page.getByRole('button', {name: 'Insert', exact: true}).click();
        await confirmation.getByRole('button', {name: 'Replace', exact: true}).click();
        await expect(page.locator('.g-md-yfm-html-constructor__structure-content')).toHaveText(
            'Custom draft',
        );
        await expect(blockContent(page)).toHaveCount(0);
    });

    for (const dismissal of ['Escape', 'outside click'] as const) {
        test(`keeps the code cursor and saves on ${dismissal}`, async ({mount, page}) => {
            const theme = dismissal === 'Escape' ? 'light' : 'dark';
            await mount(<HtmlConstructorFixture theme={theme} />);
            await addBlock(page, theme);
            const input = await openCodeEditor(page);
            const original = await input.inputValue();
            const position = original.indexOf('Alpha beta') + 'Alpha'.length;
            expect(position).toBeGreaterThan('Alpha'.length);

            await input.focus();
            await input.evaluate((element, caret) => {
                (element as HTMLTextAreaElement).setSelectionRange(caret, caret);
            }, position);
            await input.pressSequentially(' updated');

            const edited = original.replace('Alpha beta', 'Alpha updated beta');
            await expect(input).toHaveValue(edited);
            expect(
                await input.evaluate((element) => (element as HTMLTextAreaElement).selectionStart),
            ).toBe(position + ' updated'.length);

            if (dismissal === 'Escape') await input.press('Escape');
            else await page.mouse.click(4, 4);

            await expect(input).not.toBeVisible();
            await expect(heading(page)).toHaveText('Alpha updated beta');
            const reopened = await openCodeEditor(page);
            expect(await reopened.inputValue()).toContain('Alpha updated beta');
        });
    }

    test('opens inline editing from the keyboard and preserves spaces and IME input', async ({
        mount,
        page,
    }) => {
        await mount(<HtmlConstructorFixture />);
        await addBlock(page);

        const content = blockContent(page);
        await content.focus();
        await content.press('Enter');

        const popup = page.getByRole('dialog', {name: 'Edit element', exact: true});
        const input = popup.getByRole('textbox', {name: 'Text', exact: true});
        await expect(input).toBeFocused();
        await input.fill('New');
        await input.press('Space');
        await input.pressSequentially('value');
        await expect(input).toHaveValue('New value');

        await input.dispatchEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 229,
            isComposing: true,
            bubbles: true,
        });
        await expect(popup).toBeVisible();
        await expect(input).toHaveValue('New value');
        await expect(heading(page)).toHaveText('Alpha beta');

        await input.press('Enter');
        await expect(popup).not.toBeVisible();
        await expect(heading(page)).toHaveText('New value');
        await expect(content).toBeFocused();
    });

    test('keeps invalid attribute edits recoverable without mutating the preview', async ({
        mount,
        page,
    }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await mount(<HtmlConstructorFixture />);
        await addBlock(page);
        await heading(page).click();

        const popup = page.getByRole('dialog', {name: 'Edit element', exact: true});
        const input = popup.getByRole('textbox', {name: 'Text', exact: true});
        await input.fill('Updated heading');
        await popup.getByRole('button', {name: /^Attributes/}).click();
        await popup.getByRole('button', {name: 'Add attribute', exact: true}).click();
        const attribute = popup.getByRole('textbox', {name: 'name', exact: true}).last();
        await attribute.fill('invalid name');
        await popup.getByRole('textbox', {name: 'value: invalid name', exact: true}).fill('note');
        await popup.getByRole('button', {name: 'Save', exact: true}).click();

        await expect(popup.getByRole('alert')).toContainText('Attribute names');
        await expect(input).toHaveValue('Updated heading');
        await expect(heading(page)).toHaveText('Alpha beta');
        expect(errors).toEqual([]);

        await attribute.fill('data-note');
        await popup.getByRole('button', {name: 'Save', exact: true}).click();
        await expect(popup).not.toBeVisible();
        await expect(heading(page)).toHaveText('Updated heading');
        await expect(heading(page)).toHaveAttribute('data-note', 'note');
        expect(errors).toEqual([]);
    });

    test('keeps the picker inside a narrow viewport and opens variants explicitly', async ({
        mount,
        page,
    }) => {
        await page.setViewportSize({width: 390, height: 844});
        await mount(<HtmlConstructorFixture />);
        await openBlockPicker(page);

        const picker = page.locator('.g-md-yfm-html-constructor__structures');
        await expect(picker).toBeVisible();
        await expectInsideViewport(page, picker);
        await page.getByRole('button', {name: 'Test card', exact: true}).hover();
        const variant = page.getByRole('button', {name: 'Blue variant', exact: true});
        await expect(variant).not.toBeVisible();

        const variants = page.getByRole('button', {name: '1 variant', exact: true});
        await variants.focus();
        await variants.press('Enter');
        await expect(variant).toBeVisible();
        await expect(variants).toHaveAttribute('aria-expanded', 'true');
        await expectInsideViewport(
            page,
            page.locator('.g-md-yfm-html-constructor__structure-themes'),
        );

        await variant.click();
        await expect(picker).not.toBeVisible();
        await expect(heading(page)).toHaveText('Alpha beta');
    });
});
