import {expect, test} from 'playwright/core';
import type {CaptureScreenshotParams} from 'playwright/core/types';

import {
    CommandMenuPlayground,
    PresetCommandMenuPlayground,
    PresetOverOptionsCommandMenuPlayground,
    PresetOverOptionsSelectionToolbarPlayground,
    PresetSelectionToolbarPlayground,
    SelectionToolbarPlayground,
} from './ContextToolbars.helpers';

const mountOptions = {
    hidePlaygroundBlocks: true,
    width: '100%',
    rootStyle: {
        width: '100%',
        height: '100%',
        padding: 0,
    },
};

const screenshotParams: CaptureScreenshotParams = {
    fullPage: true,
    caret: 'hide',
};

const presetCommands = ['Heading 1', 'Heading 2', 'Quote'];

test.describe('ContextToolbars', () => {
    test.beforeEach(async ({page}) => {
        await page.setViewportSize({height: 256, width: 812});
    });

    test('should show selection toolbar @wysiwyg', async ({
        mount,
        editor,
        wait,
        expectScreenshot,
    }) => {
        await mount(<SelectionToolbarPlayground />, mountOptions);
        await editor.switchMode('wysiwyg');

        await editor.selectTextIn('p');

        const actions = editor.locators.toolbars.selection.getByRole('button');
        await expect(actions).toHaveCount(2);
        await expect(actions.nth(0)).toHaveAccessibleName('Italic');
        await expect(actions.nth(1)).toHaveAccessibleName('Bold');

        await wait.timeout(200); // waiting for popup to be positioned

        await expectScreenshot(screenshotParams);
    });

    test('should show command menu @wysiwyg', async ({
        mount,
        editor,
        page,
        wait,
        expectScreenshot,
    }) => {
        await mount(<CommandMenuPlayground />, mountOptions);
        await editor.switchMode('wysiwyg');

        await editor.openCommandMenuToolbar();

        const menu = editor.locators.toolbars.commandMenu;
        await expect(menu.locator('.g-md-command-menu__item-title')).toHaveText([
            'Heading 1',
            'Bullet list',
            'Quote',
        ]);
        await expect(menu).not.toContainText('Heading 2');

        // markup preview of the playground is debounced by 500 ms
        await expect(page.locator('.playground__markup')).toHaveText('/');

        await wait.timeout(200); // waiting for popup to be positioned

        await expectScreenshot(screenshotParams);
    });

    test('should show selection toolbar from toolbars preset @wysiwyg', async ({
        mount,
        editor,
        wait,
        expectScreenshot,
    }) => {
        await mount(<PresetSelectionToolbarPlayground />, mountOptions);
        await editor.switchMode('wysiwyg');

        await editor.selectTextIn('p');

        const toolbar = editor.locators.toolbars.selection;
        await expect(toolbar.getByTestId('g-md-toolbar-text-select')).toBeVisible();
        await expect(toolbar.getByRole('button', {name: 'Bold', exact: true})).toBeVisible();
        await expect(toolbar.getByRole('button', {name: 'Italic', exact: true})).toBeVisible();
        await expect(toolbar.getByLabel('Text color')).toBeVisible();

        await wait.timeout(200); // waiting for popup to be positioned

        await expectScreenshot(screenshotParams);
    });

    test('should show command menu from toolbars preset @wysiwyg', async ({
        mount,
        editor,
        page,
        wait,
        expectScreenshot,
    }) => {
        await mount(<PresetCommandMenuPlayground />, mountOptions);
        await editor.switchMode('wysiwyg');

        await editor.openCommandMenuToolbar();

        const menu = editor.locators.toolbars.commandMenu;
        await expect(menu.locator('.g-md-command-menu__item-title')).toHaveText(presetCommands);

        // markup preview of the playground is debounced by 500 ms
        await expect(page.locator('.playground__markup')).toHaveText('/');

        await wait.timeout(200); // waiting for popup to be positioned

        await expectScreenshot(screenshotParams);
    });

    test('should prefer toolbars preset over the selection context option @wysiwyg', async ({
        mount,
        editor,
    }) => {
        await mount(<PresetOverOptionsSelectionToolbarPlayground />, mountOptions);
        await editor.switchMode('wysiwyg');

        await editor.selectTextIn('p');

        const toolbar = editor.locators.toolbars.selection;
        await expect(toolbar.getByRole('button', {name: 'Bold', exact: true})).toBeVisible();
        await expect(
            toolbar.getByRole('button', {name: 'Strikethrough', exact: true}),
        ).toBeHidden();
    });

    test('should prefer toolbars preset over the command menu option @wysiwyg', async ({
        mount,
        editor,
    }) => {
        await mount(<PresetOverOptionsCommandMenuPlayground />, mountOptions);
        await editor.switchMode('wysiwyg');

        await editor.openCommandMenuToolbar();

        const menu = editor.locators.toolbars.commandMenu;
        await expect(menu.locator('.g-md-command-menu__item-title')).toHaveText(presetCommands);
    });
});
