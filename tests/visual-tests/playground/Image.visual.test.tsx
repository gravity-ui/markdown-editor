import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Images', () => {
    test.beforeEach(async ({mount, editor}) => {
        const initialMarkup = dd`
            some text
        `;

        await mount(<Playground initial={initialMarkup} width="100%" />);
        await editor.switchMode('wysiwyg');
    });

    test.describe('insert', () => {
        test('should insert via toolbar @wysiwyg', async ({
            expectScreenshot,
            actions,
            page,
            editor,
            wait,
        }) => {
            await editor.assertAdditionalToolbarButtonEnabled('Image');

            await editor.focus();
            await editor.press('ArrowDown', 2);
            await editor.press('Enter');

            await editor.clickAdditionalToolbarButton('Image');
            await wait.timeout();

            const addByLinkTab = page.getByText('Add by link').first().locator('..');
            await wait.visible(addByLinkTab);

            await addByLinkTab.click();
            await wait.timeout();

            await actions.fillFocused(`/assets/test-image.jpg`);
            await wait.timeout();

            await actions.pressFocused('Tab', 7);
            await actions.pressFocused('Enter');
            await wait.timeout(500);

            await page.mouse.move(-1, -1);
            await expectScreenshot();
        });

        test('should insert via command menu @wysiwyg', async ({page, editor, actions, wait}) => {
            await editor.focus();
            await editor.press('ArrowDown', 2);
            await editor.press('Enter');

            await editor.openCommandMenuToolbar('im');

            const imageMenu = editor.getByTextInCommandMenu('Image').first();
            await wait.visible(imageMenu);

            await imageMenu.click();
            await wait.timeout();

            const addByLinkTab = page.getByText('Add by link').first().locator('..');
            await wait.visible(addByLinkTab);

            await addByLinkTab.click();
            await wait.timeout();

            await actions.fillFocused(`/assets/test-image.jpg`);
            await wait.timeout();

            await actions.pressFocused('Tab', 7);
            await actions.pressFocused('Enter');
            await wait.timeout(500);

            await expect(
                editor.getBySelectorInContenteditable('.g-md-resizable img'),
            ).toBeVisible();
        });

        test('should insert via toolbar @markup', async ({editor, wait, actions, page}) => {
            await editor.switchMode('markup');
            await editor.focus();
            await editor.press('ArrowDown', 2);
            await editor.press('Enter');

            await editor.clickAdditionalToolbarButton('Image');
            await wait.timeout();

            const addByLinkTab = page.getByText('Add by link').first().locator('..');
            await wait.visible(addByLinkTab);

            await addByLinkTab.click();
            await wait.timeout();

            await actions.fillFocused(`/assets/test-image.jpg`);
            await wait.timeout();

            await actions.pressFocused('Tab', 7);
            await actions.pressFocused('Enter');
            await wait.timeout(500);

            await expect(
                editor.getByTextInContenteditable('![](/assets/test-image.jpg)'),
            ).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({
            editor,
            wait,
            expectScreenshot,
            page,
        }) => {
            const markup = dd`
                some text

                ![](/assets/test-image.jpg)

                text
            `;

            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill(markup);
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('some text')).toBeVisible();
            await expect(editor.getByTextInContenteditable('/assets/test-image.jpg')).toBeVisible();

            await editor.switchMode('wysiwyg');
            await wait.timeout(500);

            await page.mouse.move(-1, -1);
            await expectScreenshot();
        });
    });

    test.describe('specific', () => {
        test('should change image size @wysiwyg', async ({
            wait,
            editor,
            page,
            actions,
            expectScreenshot,
            browserName,
        }) => {
            test.skip(browserName === 'webkit', 'fillFocused does not work correctly in webkit');

            const markup = dd`
                some text

                ![](/assets/test-image.jpg)

                text
            `;

            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill(markup);
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('some text')).toBeVisible();
            await expect(editor.getByTextInContenteditable('/assets/test-image.jpg')).toBeVisible();

            await editor.switchMode('wysiwyg');
            await wait.timeout(500);

            await page.mouse.move(400, 400);
            await editor.image.clickImageSettingsButton();
            await wait.timeout(500);

            await editor.image.clickImageSettingsMenu('Edit');
            await wait.timeout(500);

            await actions.fillFocused('Title');
            await actions.pressFocused('Tab', 2);
            await actions.fillFocused('Markdown Editor');
            await actions.pressFocused('Tab');
            await actions.fillFocused('400');
            await actions.pressFocused('Tab', 2);
            await expectScreenshot({nameSuffix: 'edit-popup'});

            await actions.pressFocused('Enter');
            await wait.timeout(500);

            await page.mouse.move(-1, -1);
            await expectScreenshot();
            await wait.timeout();

            await editor.switchMode('markup');
            await wait.timeout(500);

            await expect(
                editor.getByTextInContenteditable(
                    '![Markdown Editor](/assets/test-image.jpg "Title" =400x)',
                ),
            ).toBeVisible();
        });
    });
});
