import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Markup emoji', () => {
    test.beforeEach(async ({mount}) => {
        await mount(<Playground initial="" initialEditor="markup" />, {
            hidePlaygroundBlocks: true,
            width: '100%',
            rootStyle: {width: '100%', height: '100%', padding: 0},
        });
    });

    test('should insert a suggested emoji with the keyboard and undo it', async ({
        editor,
        page,
    }) => {
        await editor.pressSequentially(':smi');
        const option = editor.locators.cmAutocomplete
            .getByRole('option')
            .filter({hasText: ':smile:'});
        await expect(option).toBeVisible();
        // CodeMirror ignores completion keys during its initial 75 ms interaction delay.
        await page.waitForTimeout(100);
        await editor.press('ArrowDown');
        const selectedLabel = await editor.locators.cmAutocomplete
            .getByRole('option', {selected: true})
            .locator('.cm-completionLabel')
            .innerText();
        await editor.press('Enter');

        await expect(editor.locators.contenteditable).toHaveText(selectedLabel);
        await editor.press('ControlOrMeta+z');
        await expect(editor.locators.contenteditable).toHaveText(':smi');
    });

    test('should open the toolbar list without changing the document', async ({editor, page}) => {
        await editor.pressSequentially('Hello');
        await editor.openMainToolbarMoreMenu();
        await editor.locators.toolbars.additional.getByLabel('Emoji', {exact: true}).click();
        await expect(editor.locators.cmAutocomplete).toBeVisible();
        await page.waitForTimeout(100);
        await editor.press('Escape');

        await expect(editor.locators.cmAutocomplete).toBeHidden();
        await expect(editor.locators.contenteditable).toHaveText('Hello');
    });

    test('should select an emoji with the mouse and preserve it across modes', async ({editor}) => {
        await editor.pressSequentially('Hello :smi');
        await editor.locators.cmAutocomplete
            .getByRole('option')
            .filter({hasText: ':smile:'})
            .click();

        await expect(editor.locators.contenteditable).toHaveText('Hello :smile:');
        await expect(editor.locators.contenteditable).toBeFocused();
        await editor.switchMode('wysiwyg');
        await expect(editor.locators.contenteditable).toContainText('😄');
        await editor.switchMode('markup');
        await expect(editor.locators.contenteditable).toHaveText('Hello :smile:');
    });
});
