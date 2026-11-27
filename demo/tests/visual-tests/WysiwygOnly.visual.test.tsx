import {expect, test} from 'playwright/core';

import {WysiwygBroken, WysiwygOnly, WysiwygRecovery} from './WysiwygOnly.helpers';

test.describe('WysiwygOnly', () => {
    test.beforeEach(async ({page}) => {
        await page.setViewportSize({width: 820, height: 400});
    });

    test('should edit and export Markdown with standalone settings @wysiwyg', async ({
        mount,
        editor,
        expectScreenshot,
    }) => {
        await mount(<WysiwygOnly initialMarkup="Edit this text" viewWidth={780} />, {width: 780});
        await expect(editor.locators.contenteditable).toContainText('Edit this text');
        await editor.wysiwygOnly.fitViewportToEditor();
        await expectScreenshot({component: editor.locators.component, caret: 'hide'});

        await editor.openSettingsPopup();
        await editor.wysiwygOnly.assertSettings();
        await editor.wysiwygOnly.toggleToolbar();
        await expect(editor.locators.toolbars.main).toBeHidden();
        await editor.openSettingsPopup();
        await editor.wysiwygOnly.toggleToolbar();
        await expect(editor.locators.toolbars.main).toBeVisible();

        await editor.wysiwygOnly.fill('Edited document');
        await editor.selectTextIn('p');
        await editor.clickMainToolbarButton('Bold');
        await editor.press('ArrowRight');
        await editor.wysiwygOnly.exportMarkdown();
        await expect(editor.wysiwygOnly.exportedMarkup).toHaveText('**Edited document**');
    });

    test('should paste HTML and search the standalone document @wysiwyg', async ({
        mount,
        editor,
    }) => {
        await mount(<WysiwygOnly initialMarkup="" />, {width: 780});
        await editor.paste({'text/html': '<p>A <strong>pasted</strong> paragraph</p>'});
        await editor.wysiwygOnly.exportMarkdown();
        await expect(editor.wysiwygOnly.exportedMarkup).toHaveText('A **pasted** paragraph');

        await editor.focus();
        await editor.press('ControlOrMeta+f');
        await editor.searchPanel.waitForVisible();
        await editor.searchPanel.fillFindText('pasted');
        await expect(editor.searchPanel.counterLocator).toContainText('1');
        await editor.searchPanel.close();
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    test('should recover live Markdown after a toolbar render error @wysiwyg', async ({
        mount,
        editor,
    }) => {
        await mount(<WysiwygRecovery />, {width: 780});
        await editor.wysiwygOnly.fill('Edited before failure');
        await editor.wysiwygOnly.failToolbar();
        await expect(editor.wysiwygOnly.error).toBeVisible();
        await editor.wysiwygOnly.recoverMarkdown();
        await expect(editor.wysiwygOnly.recoveredMarkup).toHaveValue('Edited before failure');
    });

    test('should export Markdown from the initially broken story @wysiwyg', async ({
        mount,
        editor,
    }) => {
        await mount(<WysiwygBroken />, {width: 780});
        await expect(editor.wysiwygOnly.error).toBeVisible();
        await editor.wysiwygOnly.recoverMarkdown();
        await expect(editor.wysiwygOnly.recoveredMarkup).toHaveValue(
            '## Document before the error\n\nThis text can still be exported.',
        );
    });

    test('should render mobile controls and keep toolbar settings @wysiwyg', async ({
        mount,
        editor,
        page,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 390, height: 400});
        await mount(<WysiwygOnly mobile viewWidth={350} />, {width: 350});
        await expect(editor.locators.toolbars.main).toBeVisible();
        await editor.wysiwygOnly.fitViewportToEditor();
        await expectScreenshot({component: editor.locators.component, caret: 'hide'});
        await editor.clickMainToolbarButton('Heading');
        await expect(editor.getToolbarMenuByLabel('Heading')).toBeVisible();
        await editor.press('Escape');
        await editor.openSettingsPopup();
        await editor.wysiwygOnly.assertSettings();
    });
});
