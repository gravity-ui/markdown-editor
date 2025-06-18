import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Headings', () => {
    test.beforeEach(async ({mount, page}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
    });

    test.describe('mark', () => {
        test('should mark via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Heading');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Heading', 'Heading 2');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertMainToolbarButtonSelected('Heading');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Heading');
        });

        test('should mark via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Heading');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('## next');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertMainToolbarButtonSelected('Heading');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Heading');
        });

        test('should mark via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Heading', 'Heading 2');
            await wait.timeout();

            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('## next')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.clearContent();

            const markup = 'some text\n## next';
            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await wait.timeout();

            await editor.assertMainToolbarButtonSelected('Heading');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('Heading');
        });
    });

    test.describe('interaction', () => {
        test('should add mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Heading');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('Heading');
            await editor.clickMainToolbarButton('Heading', 'Heading 2');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('Heading');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('Heading');
        });

        test('should add mark to selected text via context toolbar @wysiwyg', async ({
            editor,
            wait,
        }) => {
            await editor.switchMode('wysiwyg');
            await editor.assertMainToolbarButtonNotSelected('Heading');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('Heading');
            await editor.assertSelectionToolbarButtonSelected('Heading', 'Text');

            await editor.clickSelectionToolbarButton('Heading', 'Heading 2');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('Heading');
            await editor.press('ArrowUp');

            await editor.assertMainToolbarButtonNotSelected('Heading');
        });

        test('should delete mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.clearContent();

            const markup = 'some text\n## next';
            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout(300);

            await editor.switchMode('wysiwyg');
            await wait.timeout(300);

            await editor.selectTextIn('h2');
            await editor.assertMainToolbarButtonSelected('Heading');

            await editor.clickMainToolbarButton('Heading', 'Text');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('Heading');
        });
    });
});
