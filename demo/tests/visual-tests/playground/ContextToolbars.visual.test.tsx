import {expect, test} from 'playwright/core';
import type {CaptureScreenshotParams} from 'playwright/core/types';

import {CommandMenuPlayground, SelectionToolbarPlayground} from './ContextToolbars.helpers';

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
});
