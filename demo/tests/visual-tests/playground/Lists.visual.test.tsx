import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Bullet lists', () => {
    test.beforeEach(async ({mount, page}) => {
        await mount(<Playground initial="" width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
    });

    test.describe('insert', () => {
        test.beforeEach(async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');
        });

        test('should insert via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('List', 'Bullet list');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertMainToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('List');
        });

        test('should insert via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('* next');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertMainToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('List');
        });

        test('should insert via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');
            await wait.timeout();

            await editor.clickMainToolbarButton('List', 'Bullet list');
            await wait.timeout(300);

            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('- next')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test.beforeEach(async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');
        });

        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text\n- next';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await wait.timeout();

            await editor.assertMainToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('List');
        });
    });

    test.describe('interaction', () => {
        test.beforeEach(async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');
        });

        test('should add marker to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('List');
            await editor.clickMainToolbarButton('List', 'Bullet list');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('List');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('List');
        });
    });

    test.describe('specific', () => {
        test.beforeEach(async ({editor, wait}) => {
            await editor.switchMode('markup');
            const markup = '- first\n- second\n\ntext';
            await editor.fill(markup);

            await editor.switchMode('wysiwyg');
            await wait.timeout(500);
        });

        test('should sink list item @wysiwyg', async ({editor, expectScreenshot, wait}) => {
            await editor.assertMainToolbarButtonDisabled('List', 'Sink item');
            await editor.press('ArrowUp');

            await editor.assertMainToolbarButtonEnabled('List', 'Sink item');
            await editor.clickMainToolbarButton('List', 'Sink item');

            await wait.timeout(500);
            await expectScreenshot();

            await editor.assertMainToolbarButtonDisabled('List', 'Sink item');
        });

        test('should lift list item @wysiwyg', async ({editor, expectScreenshot, wait}) => {
            await editor.switchMode('wysiwyg');
            await wait.timeout(500);

            await editor.assertMainToolbarButtonDisabled('List', 'Lift item');
            await editor.press('ArrowUp');

            await editor.assertMainToolbarButtonEnabled('List', 'Lift item');
            await editor.clickMainToolbarButton('List', 'Lift item');

            await wait.timeout(500);
            await expectScreenshot();

            await editor.assertMainToolbarButtonDisabled('List', 'Lift item');
        });

        test('should sink list item @markup', async ({editor, expectScreenshot, wait}) => {
            await editor.switchMode('markup');
            await wait.timeout(500);

            await editor.press('ArrowUp', 2);
            await editor.clickMainToolbarButton('List', 'Sink item');

            await wait.timeout(500);
            await expectScreenshot();
        });
    });
});

test.describe('Ordered lists', () => {
    test.beforeEach(async ({mount, page}) => {
        await mount(<Playground initial="" width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
    });

    test.describe('insert', () => {
        test.beforeEach(async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');
        });

        test('should insert via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('List', 'Ordered list');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.assertMainToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('List');
        });

        test('should insert via input rule @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.inputRule('1. next');
            await wait.timeout();
            await editor.press('ArrowLeft');

            await editor.assertMainToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('List');
        });

        test('should insert via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');
            await wait.timeout();

            await editor.clickMainToolbarButton('List', 'Ordered list');
            await wait.timeout(300);

            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('1. next')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test.beforeEach(async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');
        });

        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text\n1. next';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await wait.timeout();

            await editor.assertMainToolbarButtonSelected('List');

            await editor.press('ArrowUp');
            await editor.assertMainToolbarButtonNotSelected('List');
        });
    });

    test.describe('interaction', () => {
        test.beforeEach(async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');
        });

        test('should add marker to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.assertMainToolbarButtonNotSelected('List');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertMainToolbarButtonNotSelected('List');
            await editor.clickMainToolbarButton('List', 'Ordered list');
            await wait.timeout(300);

            await editor.assertMainToolbarButtonSelected('List');
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.assertMainToolbarButtonNotSelected('List');
        });
    });

    test.describe('specific', () => {
        test.beforeEach(async ({editor, wait}) => {
            await editor.switchMode('markup');
            const markup = '1. first\n2. second\n\ntext';
            await editor.fill(markup);

            await editor.switchMode('wysiwyg');
            await wait.timeout(500);
        });

        test('should sink list item @wysiwyg', async ({editor, expectScreenshot, wait}) => {
            await editor.assertMainToolbarButtonDisabled('List', 'Sink item');
            await editor.press('ArrowUp');

            await editor.assertMainToolbarButtonEnabled('List', 'Sink item');
            await editor.clickMainToolbarButton('List', 'Sink item');

            await wait.timeout(500);
            await expectScreenshot();

            await editor.assertMainToolbarButtonDisabled('List', 'Sink item');
        });

        test('should lift list item @wysiwyg', async ({editor, expectScreenshot, wait}) => {
            await editor.assertMainToolbarButtonDisabled('List', 'Lift item');
            await editor.press('ArrowUp');

            await editor.assertMainToolbarButtonEnabled('List', 'Lift item');
            await editor.clickMainToolbarButton('List', 'Lift item');

            await wait.timeout(500);
            await expectScreenshot();

            await editor.assertMainToolbarButtonDisabled('List', 'Lift item');
        });

        test('should sink list item @markup', async ({editor, expectScreenshot, wait}) => {
            await editor.switchMode('markup');
            await editor.press('ArrowUp', 2);
            await editor.clickMainToolbarButton('List', 'Sink item');

            await wait.timeout(500);
            await expectScreenshot();
        });
    });
});
