import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Bold', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} />);
    });

    test.describe('mark', () => {
        test('should mark via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Bold');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickToolbarButton('Bold');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertToolbarButtonSelected('Bold');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('Bold');
        });

        test('should mark via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Bold');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('**next**');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertToolbarButtonSelected('Bold');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('Bold');
        });

        // key combo fails in headless mode
        test.skip('should mark via keyboard shortcut @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Bold');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.press('Control+B');
            await wait.timeout();

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.assertToolbarButtonSelected('Bold');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('Bold');
        });

        test('should mark via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickToolbarButton('Bold');
            await wait.timeout();
            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('**next**')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.clearContent();

            const markup = 'some text\n**next**';
            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await wait.timeout();

            await editor.assertToolbarButtonSelected('Bold');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('Bold');

            await editor.switchMode('markup');
        });
    });

    test.describe('interaction', () => {
        test('should add mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Bold');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertToolbarButtonNotSelected('Bold');
            await editor.clickToolbarButton('Bold');
            await wait.timeout(300);

            await editor.assertToolbarButtonSelected('Bold');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertToolbarButtonNotSelected('Bold');
        });

        test('should add mark to selected text via context toolbar @wysiwyg', async ({
            editor,
            wait,
        }) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Bold');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertToolbarButtonNotSelected('Bold');
            await editor.assertToolbarButtonNotSelected('Bold', true);
            await editor.clickToolbarButton('Bold', true);
            await wait.timeout(300);

            await editor.assertToolbarButtonSelected('Bold');
            await editor.press('ArrowUp');

            await editor.assertToolbarButtonNotSelected('Bold');
        });

        test('should delete mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('**next**');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');
            await editor.assertToolbarButtonSelected('Bold');

            await editor.clickToolbarButton('Bold');
            await wait.timeout();
            await editor.assertToolbarButtonNotSelected('Bold');
        });
    });
});
