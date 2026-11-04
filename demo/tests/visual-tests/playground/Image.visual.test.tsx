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
            // Key presses made while the menu is open do not always reach the editor
            await editor.hideToolbarMoreMenu();

            await editor.clickLastBlockAndPressEnd();
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
            await editor.clickLastBlockAndPressEnd();
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
            await editor.clickLastBlockAndPressEnd();
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

            await expect(editor.getByTextInContenteditable('some text')).toBeVisible();
            await expect(editor.getByTextInContenteditable('/assets/test-image.jpg')).toBeVisible();

            await editor.switchMode('wysiwyg');
            await expect(
                editor.getBySelectorInContenteditable('.g-md-resizable img'),
            ).toBeVisible();

            await page.mouse.move(400, 400);
            await editor.image.clickImageSettingsButton();

            await editor.image.clickImageSettingsMenu('Edit');

            const imageForm = page.getByRole('dialog');
            await expect(
                imageForm.locator('.g-md-image-tooltip-form__input_type_name input'),
            ).toBeFocused();

            await actions.fillFocused('Title');
            await actions.pressFocused('Tab', 2);
            await actions.fillFocused('Markdown Editor');
            await actions.pressFocused('Tab');
            await actions.fillFocused('400');
            await actions.pressFocused('Tab', 2);
            await expect(
                imageForm.getByRole('button', {name: 'Submit', exact: true}),
            ).toBeFocused();
            await expectScreenshot({nameSuffix: 'edit-popup'});

            await actions.pressFocused('Enter');
            await expect(editor.getBySelectorInContenteditable('.g-md-resizable img')).toHaveCSS(
                'width',
                '400px',
            );
            await expect(page.locator('.playground__markup')).toContainText(
                '![Markdown Editor](/assets/test-image.jpg "Title" =400x)',
            );

            await page.mouse.move(-1, -1);
            await expectScreenshot();

            await editor.switchMode('markup');

            await expect(
                editor.getByTextInContenteditable(
                    '![Markdown Editor](/assets/test-image.jpg "Title" =400x)',
                ),
            ).toBeVisible();
        });

        test('should keep cursor and scroll when closing image form by clicking text @wysiwyg', async ({
            editor,
            page,
        }) => {
            const markup = [
                '![](/assets/test-image.jpg)',
                ...Array.from({length: 50}, (_, index) => `Paragraph ${index}`),
                'Cursor target',
            ].join('\n\n');

            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill(markup);
            await editor.switchMode('wysiwyg');

            await editor.getBySelectorInContenteditable('.g-md-resizable img').click();
            await expect(
                editor.getBySelectorInContenteditable('.ProseMirror-selectednode'),
            ).toBeVisible();
            await editor.image.clickImageSettingsButton();
            await editor.image.clickImageSettingsMenu('Edit');

            const imageForm = page.getByRole('dialog');
            await expect(
                imageForm.locator('.g-md-image-tooltip-form__input_type_name input'),
            ).toBeFocused();

            const target = editor.getByTextInContenteditable('Cursor target');
            await target.scrollIntoViewIfNeeded();
            const scrollY = await page.evaluate(() => window.scrollY);
            // Keep the mouse down while the popup closes, as a real click can do.
            await target.click({position: {x: 5, y: 5}, delay: 100});

            await expect(imageForm).toBeHidden();
            expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
            await page.keyboard.type('MARK');
            await expect(target).toContainText('MARK');
        });

        test('should focus and edit image link with keyboard @wysiwyg', async ({
            editor,
            page,
            actions,
        }) => {
            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill('[![](/assets/test-image.jpg)](https://example.com)');
            await editor.switchMode('wysiwyg');
            await expect(
                editor.getBySelectorInContenteditable('.g-md-resizable img'),
            ).toBeVisible();

            await page.mouse.move(400, 400);
            await editor.image.clickImageSettingsButton();
            await editor.image.clickImageSettingsMenu('Edit');

            const imageForm = page.getByRole('dialog');
            await expect(
                imageForm.locator('.g-md-image-tooltip-form__input_type_link input'),
            ).toBeFocused();
            await actions.fillFocused('https://example.org');
            await actions.pressFocused('Tab');
            await page.waitForLoadState('networkidle');
            await expect(
                imageForm.locator('.g-md-image-tooltip-form__input_type_name input'),
            ).toBeFocused();
            await actions.pressFocused('Enter');

            await expect(imageForm).toBeHidden();
            await expect(editor.locators.contenteditable).toBeFocused();
            await expect(page.locator('.playground__markup')).toContainText(
                '[![](/assets/test-image.jpg)](https://example.org)',
            );
        });
    });
});
