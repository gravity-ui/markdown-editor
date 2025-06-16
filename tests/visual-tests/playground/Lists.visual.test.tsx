import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Bullet lists', () => {
    test.beforeEach(async ({mount, page}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
    });

    test.describe('insert', () => {
        test('should insert via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickToolbarButton('List');
            await wait.timeout();

            await editor.clickToolbarButton('Bullet list', true);
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('List');
        });

        test('should insert via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('* next');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('List');
        });

        test('should insert via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickToolbarButton('List');
            await wait.timeout();

            await editor.clickToolbarButton('Bullet list', true);
            await wait.timeout();

            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('- next')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.clearContent();

            const markup = 'some text\n- next';
            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await wait.timeout();

            await editor.assertToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('List');
        });
    });

    test.describe('interaction', () => {
        test('should add insert to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertToolbarButtonNotSelected('List');
            await editor.clickToolbarButton('List');
            await wait.timeout();

            await editor.clickToolbarButton('Bullet list', true);
            await wait.timeout(300);

            await editor.assertToolbarButtonSelected('List');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertToolbarButtonNotSelected('List');
        });
    });
});

test.describe('Ordered lists', () => {
    test.beforeEach(async ({mount, page}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
    });

    test.describe('insert', () => {
        test('should insert via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickToolbarButton('List');
            await wait.timeout();

            await editor.clickToolbarButton('Ordered list', true);
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('List');
        });

        test('should insert via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('1. next');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('List');
        });

        test('should insert via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickToolbarButton('List');
            await wait.timeout();

            await editor.clickToolbarButton('Ordered list', true);
            await wait.timeout();

            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('1. next')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.clearContent();

            const markup = 'some text\n1. next';
            await editor.switchMode('markup');
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await wait.timeout();

            await editor.assertToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertToolbarButtonNotSelected('List');
        });
    });

    test.describe('interaction', () => {
        test('should add insert to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('wysiwyg');
            await editor.assertToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertToolbarButtonNotSelected('List');
            await editor.clickToolbarButton('List');
            await wait.timeout();

            await editor.clickToolbarButton('Ordered list', true);
            await wait.timeout(300);

            await editor.assertToolbarButtonSelected('List');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertToolbarButtonNotSelected('List');
        });
    });
});
