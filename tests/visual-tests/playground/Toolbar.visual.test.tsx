import {test} from 'playwright/core';
import type {CaptureScreenshotParams} from 'playwright/core/types';

import {Playground} from './Playground.helpers';

test.describe('Toolbar', () => {
    test.beforeEach(async ({mount}) => {
        await mount(<Playground initial="" />, {
            hidePlaygroundBlocks: true,
            width: '100%',
            rootStyle: {
                width: '100%',
                height: '100%',
                padding: 0,
            },
        });
    });

    test('should hide actions at small width', async ({page, wait, editor, expectScreenshot}) => {
        const height = 256;
        const themes = ['light'] as const;
        const screenshotParams: CaptureScreenshotParams = {
            themes,
            caret: 'hide',
            fullPage: true,
        };

        await editor.switchMode('wysiwyg');
        await editor.openToolbarMoreMenu();
        await page.mouse.move(-1, -1);

        await test.step('Set large width', async () => {
            await page.setViewportSize({height, width: 812});
            await wait.timeout(200); // waiting for popup to be positioned
            await expectScreenshot({
                ...screenshotParams,
                nameSuffix: 'width-large',
            });
        });

        await test.step('Set medium width', async () => {
            await page.setViewportSize({height, width: 512});
            await wait.timeout(200); // waiting for popup to be positioned
            await expectScreenshot({
                ...screenshotParams,
                nameSuffix: 'width-medium',
            });
        });

        await test.step('Set small width', async () => {
            await page.setViewportSize({height, width: 256});
            await wait.timeout(200); // waiting for popup to be positioned
            await expectScreenshot({
                ...screenshotParams,
                nameSuffix: 'width-small',
            });
        });

        await test.step('Switch to markup mode', async () => {
            await editor.switchMode('markup');
            await editor.openToolbarMoreMenu();
            await page.mouse.move(-1, -1);
            await expectScreenshot({
                ...screenshotParams,
                nameSuffix: 'markup-width-small',
            });
        });
    });

    test.describe('should hide all actions to more menu', () => {
        test('in @wysiwyg mode', async ({page, editor, expectScreenshot}) => {
            await page.setViewportSize({height: 256, width: 72});
            await editor.switchMode('wysiwyg');
            await editor.openToolbarMoreMenu();
            await page.mouse.move(-1, -1);
            await expectScreenshot({component: editor.locators.toolbars.additional});
        });

        test('in @markup mode', async ({page, editor, expectScreenshot}) => {
            await page.setViewportSize({height: 256, width: 96});
            await editor.switchMode('markup');
            await editor.openToolbarMoreMenu();
            await page.mouse.move(-1, -1);
            await expectScreenshot({component: editor.locators.toolbars.additional});
        });
    });

    test.describe('should have same set of actions in both modes', () => {
        test.beforeEach(async ({page}) => {
            await page.setViewportSize({height: 256, width: 812});
        });

        test('in @wysiwyg mode', async ({page, editor, expectScreenshot}) => {
            await editor.switchMode('wysiwyg');
            await editor.openToolbarMoreMenu();
            await page.mouse.move(-1, -1);

            await expectScreenshot({fullPage: true, caret: 'hide'});
        });

        test('in @markup mode', async ({editor, expectScreenshot}) => {
            await editor.switchMode('markup');
            await editor.openToolbarMoreMenu();
            await editor.hoverToolbarMoreAction('Emoji');
            await editor.waitForToolbarActionDisabledHint();

            await expectScreenshot({fullPage: true, caret: 'hide'});
        });
    });
});
