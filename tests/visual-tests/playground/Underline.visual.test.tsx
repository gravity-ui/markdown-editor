import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Underline', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} />);
    });

    test.describe('mark', () => {
        test('should mark via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Underline');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Underline');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertMainToolbarButtonSelected('Underline');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Underline');
        });

        test('should mark via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Underline');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('++next++');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertMainToolbarButtonSelected('Underline');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Underline');
        });

        // TODO: Investigate why keyboard shortcuts don't work reliably in the test environment
        test.skip('should mark via keyboard shortcut @wysiwyg', async ({editor, wait}) => {
            test.skip(true, 'key combo fails in headless mode');

            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Underline');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.press('Control+U');
            await wait.timeout();

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.assertMainToolbarButtonSelected('Underline');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Underline');
        });

        test('should mark via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Underline');
            await wait.timeout();
            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('++next++')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.clearContentAndSwitchMode('markup');

            const markup = 'some text\n++next++';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await wait.timeout();

            await editor.assertMainToolbarButtonSelected('Underline');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Underline');

            await editor.switchMode('markup');
        });
    });

    test.describe('interaction', () => {
        test('should add mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Underline');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('Underline');
            await editor.clickMainToolbarButton('Underline');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('Underline');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('Underline');
        });

        test('should add mark to selected text via context toolbar @wysiwyg', async ({
            editor,
            wait,
        }) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Underline');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('Underline');
            await editor.assertSelectionToolbarButtonNotSelected('Underline');
            await editor.clickSelectionToolbarButton('Underline');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('Underline');
            await editor.assertSelectionToolbarButtonSelected('Underline');
            await editor.press('ArrowUp');

            await editor.assertMainToolbarButtonNotSelected('Underline');
        });

        test('should delete mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('++next++');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');
            await editor.assertMainToolbarButtonSelected('Underline');
            await editor.assertSelectionToolbarButtonSelected('Underline');

            await editor.clickMainToolbarButton('Underline');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('Underline');
            await editor.assertSelectionToolbarButtonNotSelected('Underline');
        });
    });
});
