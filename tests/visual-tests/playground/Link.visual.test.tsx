import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Link', () => {
    test.beforeEach(async ({editor, mount, page}) => {
        const initialMarkup = ``;

        await mount(<Playground initial={initialMarkup} width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
        await editor.switchMode('wysiwyg');
    });

    test('should insert via toolbar @wysiwyg', async ({browserName, editor, actions, wait}) => {
        test.skip(browserName === 'webkit', 'fillFocused does not work correctly in webkit');

        await editor.clickMainToolbarButton('Link');
        await editor.link.assertFormToBeVisible();

        await wait.timeout(300);
        await actions.fillFocused('gravity-ui.com');
        await actions.pressFocused('Tab', 3);

        await actions.fillFocused('gravity');
        await actions.pressFocused('Tab', 2);

        await actions.pressFocused('Enter');

        await expect(editor.getByTextInContenteditable('gravity-ui.com')).toBeHidden();
        await expect(editor.getByTextInContenteditable('gravity')).toBeVisible();
    });

    test('should insert via command menu @wysiwyg', async ({
        browserName,
        editor,
        actions,
        wait,
    }) => {
        test.skip(browserName === 'webkit', 'fillFocused does not work correctly in webkit');

        await editor.openCommandMenuToolbar('lin');

        const linkMenu = editor.getByTextInCommandMenu('Link').first();
        await wait.visible(linkMenu);

        await linkMenu.click();
        await editor.link.assertFormToBeVisible();

        await wait.timeout(300);
        await actions.fillFocused('gravity-ui.com');
        await actions.pressFocused('Tab', 3);

        await actions.fillFocused('gravity');
        await actions.pressFocused('Tab', 2);

        await actions.pressFocused('Enter');

        await expect(editor.getByTextInContenteditable('gravity-ui.com')).toBeHidden();
        await expect(editor.getByTextInContenteditable('gravity')).toBeVisible();
    });

    test('should insert via toolbar @markup', async ({editor}) => {
        await editor.switchMode('markup');

        await editor.clickMainToolbarButton('Link');

        await expect(editor.getByTextInContenteditable('[link](url "title")')).toBeVisible();
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            const markup = dd`
                some text

                [gravity](gravity-ui.com)

                text
            `;

            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill(markup);
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('some text')).toBeVisible();
            await expect(
                editor.getByTextInContenteditable('[gravity](gravity-ui.com)'),
            ).toBeVisible();

            await editor.switchMode('wysiwyg');
            await wait.timeout(500);

            await expect(editor.getByTextInContenteditable('gravity-ui.com')).toBeHidden();
            await expect(editor.getByTextInContenteditable('gravity')).toBeVisible();
        });
    });

    test.describe('specific', () => {
        test('should open edit popup on link click @wysiwyg', async ({
            editor,
            expectScreenshot,
            wait,
        }) => {
            const markup = dd`
                some text

                [gravity](gravity-ui.com)

                text
            `;

            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill(markup);
            await wait.timeout();

            await expect(editor.getByTextInContenteditable('some text')).toBeVisible();
            await expect(
                editor.getByTextInContenteditable('[gravity](gravity-ui.com)'),
            ).toBeVisible();

            await editor.switchMode('wysiwyg');
            await wait.timeout(500);

            await expect(editor.getByTextInContenteditable('gravity-ui.com')).toBeHidden();
            await expect(editor.getByTextInContenteditable('gravity')).toBeVisible();

            await editor.getByTextInContenteditable('gravity').click();

            await expectScreenshot();
        });
    });
});
