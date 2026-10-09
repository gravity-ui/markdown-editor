import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Marked', () => {
    test.beforeEach(async ({editor, mount}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} />);
        await editor.switchMode('wysiwyg');
    });

    test.describe('mark', () => {
        test('should mark via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('Marked');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Marked');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertMainToolbarButtonSelected('Marked');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Marked');
        });

        test('should mark via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('Marked');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('==next==');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertMainToolbarButtonSelected('Marked');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Marked');
        });

        test('should mark via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickAdditionalToolbarButton('Marked');
            await wait.timeout();
            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('==next==')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text\n==next==';
            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await wait.timeout();

            await editor.assertMainToolbarButtonSelected('Marked');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Marked');

            await editor.switchMode('markup');
        });
    });

    test.describe('interaction', () => {
        test('should add mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('Marked');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('Marked');
            await editor.clickMainToolbarButton('Marked');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('Marked');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('Marked');
        });

        test('should add mark to selected text via context toolbar @wysiwyg', async ({
            editor,
            wait,
        }) => {
            await editor.assertMainToolbarButtonNotSelected('Marked');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('Marked');
            await editor.assertSelectionToolbarButtonNotSelected('Marked');
            await editor.clickSelectionToolbarButton('Marked');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('Marked');
            await editor.assertSelectionToolbarButtonSelected('Marked');
            await editor.press('ArrowUp');

            await editor.assertMainToolbarButtonNotSelected('Marked');
        });

        test('should delete mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('==next==');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');
            await editor.assertMainToolbarButtonSelected('Marked');
            await editor.assertSelectionToolbarButtonSelected('Marked');

            await editor.clickMainToolbarButton('Marked');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('Marked');
            await editor.assertSelectionToolbarButtonNotSelected('Marked');
        });
    });
});
