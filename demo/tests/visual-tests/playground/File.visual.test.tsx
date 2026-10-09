import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('File', () => {
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
            await editor.assertAdditionalToolbarButtonEnabled('File');

            await editor.focus();
            await editor.press('ArrowDown', 2);
            await editor.press('Enter');

            await editor.clickAdditionalToolbarButton('File');
            await wait.timeout();

            const addByLinkTab = page.getByText('Add by link').first().locator('..');
            await wait.visible(addByLinkTab);

            await addByLinkTab.click();
            await wait.timeout();

            await actions.fillFocused(`/assets/test-image.jpg`);
            await actions.pressFocused('Tab');
            await actions.fillFocused(`Background`);
            await wait.timeout();

            await actions.pressFocused('Tab', 2);
            await actions.pressFocused('Enter');
            await wait.timeout(500);

            await page.mouse.move(-1, -1);
            await expectScreenshot();
        });

        test('should insert via command menu @wysiwyg', async ({page, editor, actions, wait}) => {
            await editor.focus();
            await editor.press('ArrowDown', 2);
            await editor.press('Enter');

            await editor.openCommandMenuToolbar('fi');

            const fileMenu = editor.getByTextInCommandMenu('File').first();
            await wait.visible(fileMenu);

            await fileMenu.click();
            await wait.timeout();

            const addByLinkTab = page.getByText('Add by link').first().locator('..');
            await wait.visible(addByLinkTab);

            await addByLinkTab.click();
            await wait.timeout();

            await actions.fillFocused(`/assets/test-image.jpg`);
            await actions.pressFocused('Tab');
            await actions.fillFocused(`Background`);
            await wait.timeout();

            await actions.pressFocused('Tab', 2);
            await actions.pressFocused('Enter');
            await wait.timeout(500);

            await expect(editor.getBySelectorInContenteditable('.yfm-file')).toBeVisible();
        });

        test('should insert via toolbar @markup', async ({editor, wait, actions, page}) => {
            await editor.switchMode('markup');
            await editor.focus();
            await editor.press('ArrowDown', 2);
            await editor.press('Enter');

            await editor.clickAdditionalToolbarButton('File');
            await wait.timeout();

            const addByLinkTab = page.getByText('Add by link').first().locator('..');
            await wait.visible(addByLinkTab);

            await addByLinkTab.click();
            await wait.timeout();

            await actions.fillFocused(`/assets/test-image.jpg`);
            await actions.pressFocused('Tab');
            await actions.fillFocused(`Background`);
            await wait.timeout();

            await actions.pressFocused('Tab', 2);
            await actions.pressFocused('Enter');
            await wait.timeout(500);

            await expect(
                editor.getByTextInContenteditable(
                    '{% file src="/assets/test-image.jpg" name="Background" %}',
                ),
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

                {% file src="/assets/test-image.jpg" name="Background" %}

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
});
