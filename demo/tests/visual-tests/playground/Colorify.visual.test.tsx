import {expect, test} from 'playwright/core';
import dd from 'ts-dedent';

import {Playground} from './Playground.helpers';

test.describe('Colorify', () => {
    test.beforeEach(async ({editor, mount, page}) => {
        const initialMarkup = dd`
         some text
      `;

        await mount(<Playground initial={initialMarkup} width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 500, width: 812});
        await editor.switchMode('wysiwyg');
    });

    test.describe('mark', () => {
        test('should mark via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.colorify.assertMainToolbarColorButtonDefault();

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Text color', 'Yellow');
            await wait.timeout();

            await editor.pressSequentially('next');
            await editor.colorify.assertMainToolbarColorButtonNotDefault();

            await editor.press('ArrowUp');
            await editor.colorify.assertMainToolbarColorButtonDefault();
        });

        test('should mark via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Text color', 'Yellow');
            await wait.timeout();

            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable('{yellow}(next)')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should remain after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text\n{yellow}(next)';
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            await editor.focus();
            await editor.press('ArrowDown');
            await wait.timeout();

            await editor.colorify.assertMainToolbarColorButtonNotDefault();

            await editor.press('ArrowUp');
            await editor.colorify.assertMainToolbarColorButtonDefault();

            await editor.switchMode('markup');
        });
    });

    test.describe('interaction', () => {
        test('should add mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.colorify.assertMainToolbarColorButtonDefault();

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.colorify.assertMainToolbarColorButtonDefault();
            await editor.clickMainToolbarButton('Text color', 'Yellow');
            await wait.timeout(300);

            await editor.colorify.assertMainToolbarColorButtonNotDefault();
            await editor.press('ArrowUp');
            await wait.timeout();

            await editor.colorify.assertMainToolbarColorButtonDefault();
        });

        test('should add mark to selected text via context toolbar @wysiwyg', async ({
            editor,
            wait,
        }) => {
            await editor.colorify.assertMainToolbarColorButtonDefault();

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.pressSequentially('next');
            await wait.timeout();

            await editor.selectTextIn('p:nth-child(2)');

            await editor.colorify.assertMainToolbarColorButtonDefault();
            await editor.colorify.assertSelectionToolbarColorButtonDefault();
            await editor.clickSelectionToolbarButton('Text color', 'Yellow');
            await wait.timeout(300);

            await editor.colorify.assertMainToolbarColorButtonNotDefault();
            await editor.press('ArrowUp');

            await editor.colorify.assertMainToolbarColorButtonDefault();
        });

        test('should delete mark to selected text via toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();

            const markup = 'some text\n{yellow}(next)';
            await editor.fill(markup);
            await wait.timeout(300);

            await editor.switchMode('wysiwyg');
            await wait.timeout(300);

            await editor.selectTextIn('.yfm-colorify');
            await editor.colorify.assertMainToolbarColorButtonNotDefault();

            await editor.clickMainToolbarButton('Text color', 'Yellow');
            await wait.timeout();

            await editor.colorify.assertMainToolbarColorButtonDefault();
        });
    });

    test.describe('specific', () => {
        test('should escape parentheses', async ({page, expectScreenshot, editor, wait}) => {
            await editor.colorify.assertMainToolbarColorButtonDefault();

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Text color', 'Yellow');
            await wait.timeout();

            await editor.pressSequentially('some(');

            await editor.clickMainToolbarButton('Text color', 'Red');
            await wait.timeout();

            await editor.pressSequentially('2, 3');

            await editor.clickMainToolbarButton('Text color', 'Yellow');
            await wait.timeout();

            await editor.pressSequentially(')');
            await page.mouse.move(-1, -1);
            await wait.timeout(400);

            await expectScreenshot({nameSuffix: 'wysiwyg'});

            await editor.switchPreview('visible');
            await page.mouse.move(-1, -1);
            await wait.timeout();

            await expectScreenshot({nameSuffix: 'markup'});
        });
    });
});
