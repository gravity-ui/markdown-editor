import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Settings panel', () => {
    test.beforeEach(async ({mount}) => {
        await mount(<Playground />);
    });

    test('should open settings panel @wysiwyg', async ({editor, expectScreenshot}) => {
        await editor.switchMode('wysiwyg');
        await editor.openSettingsPopup();

        await expectScreenshot({
            component: editor.locators.settingsContent,
        });
    });

    test('should open settings panel @markup', async ({editor, expectScreenshot}) => {
        await editor.switchMode('markup');
        await editor.openSettingsPopup();

        await expectScreenshot({
            component: editor.locators.settingsContent,
        });
    });
});

test.describe('Editor keyboard accessibility', () => {
    test('should keep controls reachable without a wrapper tab stop @markup', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(
            <>
                <button>Before editor</button>
                <Playground initialEditor="markup" initialSplitModeEnabled={false} />
                <button>After editor</button>
            </>,
        );

        await expect(editor.locators.component).not.toHaveRole('button');
        await expect(editor.locators.previewButton).toHaveRole('button');
        await expect(editor.locators.settingsButton).toHaveRole('button');
        await expect(editor.locators.previewButton).toHaveAccessibleName('Preview');
        await expect(editor.locators.settingsButton).toHaveAccessibleName('Settings');

        await page.getByRole('button', {name: 'Before editor', exact: true}).focus();
        await page.keyboard.press('Tab');
        await expect(editor.locators.component).not.toBeFocused();

        await editor.locators.settingsButton.focus();
        await page.keyboard.press('Shift+Tab');
        await expect(editor.locators.previewButton).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(editor.locators.settingsButton).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(editor.locators.settingsContent).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(editor.locators.settingsContent).toBeHidden();
    });

    test('should preserve preview focus and keyboard submit @markup', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(
            <Playground
                initial="Preview keyboard navigation"
                initialEditor="markup"
                initialSplitModeEnabled={false}
                enableSubmitInPreview
                hidePreviewAfterSubmit
            />,
        );

        await editor.switchPreview('visible');
        await expect(editor.locators.component).toBeFocused();
        await expect(editor.locators.component).not.toHaveRole('button');
        await page.keyboard.press('Control+Shift+P');
        await expect(editor.locators.previewContent).toBeHidden();
        await page.keyboard.press('Control+Shift+P');
        await expect(editor.locators.previewContent).toBeVisible();
        await expect(editor.locators.component).toBeFocused();

        const submission = page.waitForEvent('dialog');
        await page.keyboard.press('Control+Enter');
        const dialog = await submission;
        expect(dialog.message()).toBe('Editor: submit');
        await dialog.accept();
        await expect(editor.locators.previewContent).toBeHidden();
    });
});
