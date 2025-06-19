import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Italic', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} />);
    });

    test.describe('mark', () => {
        test('should mark via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Italic');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Italic');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertMainToolbarButtonSelected('Italic');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Italic');
        });

        test('should mark via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Italic');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('*next*');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertMainToolbarButtonSelected('Italic');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Italic');
        });

        // TODO: Investigate why keyboard shortcuts don't work reliably in the test environment
        test('should mark via keyboard shortcut @wysiwyg', async ({editor, wait}) => {
            test.skip(true, 'key combo fails in headless mode');

            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Italic');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.press('Control+I');
            await wait.timeout();

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.assertMainToolbarButtonSelected('Italic');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Italic');
        });

        test('should mark via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Italic');
            await wait.timeout();
            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('_next_')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.clearContentAndSwitchMode('markup');

            const markup = 'some text\n*next*';
            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await wait.timeout();

            await editor.assertMainToolbarButtonSelected('Italic');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Italic');

            await editor.switchMode('markup');
        });
    });

    test.describe('interaction', () => {
        test('should add mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Italic');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('Italic');
            await editor.clickMainToolbarButton('Italic');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('Italic');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('Italic');
        });

        test('should add mark to selected text via context toolbar @wysiwyg', async ({
            editor,
            wait,
        }) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Italic');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('Italic');
            await editor.assertSelectionToolbarButtonNotSelected('Italic');
            await editor.clickSelectionToolbarButton('Italic');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('Italic');
            await editor.assertSelectionToolbarButtonSelected('Italic');
            await editor.press('ArrowUp');

            await editor.assertMainToolbarButtonNotSelected('Italic');
        });

        test('should delete mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('*next*');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');
            await editor.assertMainToolbarButtonSelected('Italic');
            await editor.assertSelectionToolbarButtonSelected('Italic');

            await editor.clickMainToolbarButton('Italic');
            await wait.timeout();
            await editor.assertMainToolbarButtonNotSelected('Italic');
            await editor.assertSelectionToolbarButtonNotSelected('Italic');
        });
    });
});
