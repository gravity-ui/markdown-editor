import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Monospace', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} />);
    });

    test.describe('mark', () => {
        test('should mark via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Monospace');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickToolbarButton('Monospace');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertToolbarButtonSelected('Monospace');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('Monospace');
        });

        test('should mark via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Monospace');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('##next##');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertToolbarButtonSelected('Monospace');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('Monospace');
        });

        test('should mark via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickToolbarButton('Monospace');
            await wait.timeout();
            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('##next##')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.clearContent();

            const markup = 'some text\n##next##';
            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await wait.timeout();

            await editor.assertToolbarButtonSelected('Monospace');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('Monospace');

            await editor.switchMode('markup');
        });
    });

    test.describe('interaction', () => {
        test('should add mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Monospace');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertToolbarButtonNotSelected('Monospace');
            await editor.clickToolbarButton('Monospace');
            await wait.timeout(300);

            await editor.assertToolbarButtonSelected('Monospace');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertToolbarButtonNotSelected('Monospace');
        });

        test('should add mark to selected text via context toolbar @wysiwyg', async ({
            editor,
            wait,
        }) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('Monospace');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertToolbarButtonNotSelected('Monospace');
            await editor.assertToolbarButtonNotSelected('Monospace', true);
            await editor.clickToolbarButton('Monospace', true);
            await wait.timeout(300);

            await editor.assertToolbarButtonSelected('Monospace');
            await editor.press('ArrowUp');

            await editor.assertToolbarButtonNotSelected('Monospace');
        });

        test('should delete mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('##next##');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');
            await editor.assertToolbarButtonSelected('Monospace');

            await editor.clickToolbarButton('Monospace');
            await wait.timeout();
            await editor.assertToolbarButtonNotSelected('Monospace');
        });
    });
});
