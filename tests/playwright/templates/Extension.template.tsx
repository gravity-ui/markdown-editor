/* eslint-disable */
// @ts-nocheck
/* TODO: delete eslint-disable and @ts-nocheck */
import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('%%name%%', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = dd`
         /* TODO: add initialMarkup */
      `;

        await mount(<Playground initial={initialMarkup} />);
    });

    test.describe('insert', () => {
        test.skip('should insert via toolbar @wysiwyg', async ({editor, wait}) => {
            /* TODO: unskip */
            await editor.switchMode('wysiwyg');
            await editor.clearContent();

            await editor.clickToolbarButton('/* TODO: extension name */');
            await wait.timeout();

            /* TODO: write test */
        });

        test.skip('should insert via command menu @wysiwyg', async ({page, editor, wait}) => {
            /* TODO: unskip */
            await editor.switchPreview('hidden');
            await editor.switchMode('wysiwyg');
            await editor.clearContent();

            await editor.pressSequentially('/* TODO: write sequentially */');
            await expect(page.getByTestId('g-md-command-menu')).toBeVisible();

            const menuItem = editor.getByTextInCommandMenu('/* TODO: write name */').first();
            await wait.visible(menuItem);

            await menuItem.click();

            await expect(
                editor.getBySelectorInContenteditable('/* TODO: write selector */'),
            ).toBeVisible();

            /* TODO: write test */
        });

        test.skip('should insert via input rule @wysiwyg', async ({editor, wait}) => {
            /* TODO: unskip */
            await editor.switchMode('wysiwyg');
            await editor.inputRuleWithClear('/* TODO: input rule */');
            await wait.timeout();

            /* TODO: write test */
        });

        test.skip('should insert via keyboard shortcut @wysiwyg', async ({editor, wait}) => {
            /* TODO: unskip */
            await editor.switchMode('wysiwyg');
            await editor.clearContent();
            await editor.press('/* TODO: add keyboard shortcut */');
            await wait.timeout();

            /* TODO: write test */
        });

        test.skip('should insert via pasted HTML @wysiwyg', async ({editor, wait}) => {
            /* TODO: unskip */
            await editor.switchMode('wysiwyg');
            await editor.clearContent();

            const html = '/* TODO: add html content */'; // TODO
            await editor.paste(html);
            await wait.timeout();

            /* TODO: write test */
        });

        test.skip('should insert via toolbar @markup', async ({editor, wait}) => {
            /* TODO: unskip */
            await editor.switchMode('markup');
            await editor.clickToolbarButton('/* TODO: extension name */');
            await wait.timeout();

            /* TODO: write test */
        });

        test.skip('should insert via command menu @markup', async ({
            page,
            editor,
            actions,
            wait,
        }) => {
            /* TODO: unskip */
            await editor.switchMode('markup');
            await editor.clearContent();

            await editor.pressSequentially('{%');
            await expect(page.getByText('/* TODO: extension name */')).toBeVisible();
            await wait.timeout(300);

            await actions.pressFocused('Enter');
            await wait.timeout(300);

            await expect(
                editor.getByTextInContenteditable('/* TODO: extension markup */'),
            ).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test.skip('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            /* TODO: unskip */
            const markup = '/* TODO: add markup\n */';

            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            /* TODO: write test */

            await editor.switchMode('markup');

            /* TODO: write test */
        });
    });

    test.describe('interaction', () => {
        test.skip('should edit block via context menu @wysiwyg', async ({editor}) => {
            /* TODO: unskip */
            await editor.switchMode('wysiwyg');
            await editor.clearContent();

            /* TODO: write test */
        });

        test.skip('should delete block via context menu @wysiwyg', async ({editor}) => {
            /* TODO: unskip */
            await editor.switchMode('wysiwyg');
            await editor.clearContent();

            /* TODO: write test */
        });

        test.skip('should delete block via remove button @wysiwyg', async ({editor}) => {
            /* TODO: unskip */
            await editor.switchMode('wysiwyg');
            await editor.clearContent();

            /* TODO: write test */
        });
    });

    test.describe('specific', () => {
        /* TODO: implement extension-specific tests */
    });
});
