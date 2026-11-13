import {expect, test} from 'playwright/core';

import {TabNavigation} from './TabNavigation.helpers';

test.describe('Tab navigation after Escape', () => {
    test('should move focus in both directions after Escape @wysiwyg', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TabNavigation mode="wysiwyg" />);
        await editor.assertMode('wysiwyg');

        await editor.focus();
        await editor.press('Escape');
        await editor.press('Tab');
        await expect(page.getByRole('button', {name: 'After editor', exact: true})).toBeFocused();

        await editor.focus();
        await editor.press('Escape');
        await editor.press('Shift+Tab');
        await expect(editor.locators.component).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(page.getByRole('button', {name: 'Before editor', exact: true})).toBeFocused();
    });

    test('should move focus in both directions after Escape @markup', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TabNavigation mode="markup" />);
        await editor.assertMode('markup');

        await editor.focus();
        await editor.press('Escape');
        await editor.press('Tab');
        await expect(page.getByRole('button', {name: 'After editor', exact: true})).toBeFocused();

        await editor.focus();
        await editor.press('Escape');
        await editor.press('Shift+Tab');
        await expect(editor.locators.component).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(page.getByRole('button', {name: 'Before editor', exact: true})).toBeFocused();
    });

    test('should keep focus in the editor after typing resets Tab exit @wysiwyg', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TabNavigation mode="wysiwyg" />);
        await editor.assertMode('wysiwyg');

        await editor.focus();
        await editor.press('Escape');
        await editor.press('x');
        await editor.press('Tab');
        await expect(editor.locators.contenteditable).toBeFocused();

        await editor.press('Escape');
        await editor.press('Tab');
        await expect(page.getByRole('button', {name: 'After editor', exact: true})).toBeFocused();
    });

    test('should keep focus in the editor after typing resets Tab exit @markup', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TabNavigation mode="markup" />);
        await editor.assertMode('markup');

        await editor.focus();
        await editor.press('Escape');
        await editor.press('x');
        await editor.press('Tab');
        await expect(editor.locators.contenteditable).toBeFocused();

        await editor.press('Escape');
        await editor.press('Tab');
        await expect(page.getByRole('button', {name: 'After editor', exact: true})).toBeFocused();
    });

    test('should ignore the persistent Tab focus shortcut when Escape navigation is enabled @markup', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TabNavigation mode="markup" />);
        await editor.assertMode('markup');

        await editor.focus();
        await editor.press('Control+m');
        await editor.press('Tab');
        await expect(editor.locators.contenteditable).toBeFocused();

        await editor.press('Escape');
        await editor.press('Tab');
        await expect(page.getByRole('button', {name: 'After editor', exact: true})).toBeFocused();
    });

    test('should toggle persistent Tab focus when Escape navigation is disabled @markup', async ({
        mount,
        editor,
        page,
    }) => {
        await mount(<TabNavigation mode="markup" enableTabExitOnEscape={false} />);
        await editor.assertMode('markup');

        await editor.focus();
        await editor.press('Control+m');
        await editor.press('Tab');
        await expect(page.getByRole('button', {name: 'After editor', exact: true})).toBeFocused();

        await editor.focus();
        await editor.press('x');
        await editor.press('Tab');
        await expect(page.getByRole('button', {name: 'After editor', exact: true})).toBeFocused();

        await editor.focus();
        await editor.press('Control+m');
        await editor.press('Tab');
        await expect(editor.locators.contenteditable).toBeFocused();
    });
});
