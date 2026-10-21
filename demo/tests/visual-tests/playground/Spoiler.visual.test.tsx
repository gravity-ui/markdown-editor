import dd from 'ts-dedent';

import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

const markup = dd`
    Plain text: :spoiler[The answer is 42]

    With marks: :spoiler[**bold**, *italic* and [a link](https://example.com)]

    Several: :spoiler[first], :spoiler[second] and :spoiler[third]

    Line break: :spoiler[first line\\
    second line]
`;

test.describe('Spoiler', () => {
    test.beforeEach(async ({editor, mount, page}) => {
        await mount(<Playground initial="some text" width="100%" style={{width: 812}} />);
        await page.setViewportSize({height: 600, width: 812});
        await editor.switchMode('wysiwyg');
    });

    test.describe('mark', () => {
        test('should add spoiler via context toolbar @wysiwyg', async ({editor, wait}) => {
            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');
            await editor.pressSequentially('secret');
            await editor.selectTextIn('p:nth-child(2)');

            await editor.assertSelectionToolbarButtonNotSelected('Spoiler');
            await editor.clickSelectionToolbarButton('Spoiler');
            await wait.timeout(300);

            await editor.assertSelectionToolbarButtonSelected('Spoiler');
            await wait.markupPreview(':spoiler[secret]');

            await editor.clickSelectionToolbarButton('Spoiler');
            await wait.timeout(300);

            await editor.assertSelectionToolbarButtonNotSelected('Spoiler');
            await expect(editor.getBySelectorInContenteditable('.yfm-spoiler')).toHaveCount(0);
        });

        test('should continue spoiler after the cursor @wysiwyg', async ({editor, wait}) => {
            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('End');
            await editor.pressSequentially(' ');

            await editor.clickMainToolbarButton('Spoiler');
            await wait.timeout();
            await editor.pressSequentially('hidden');

            await editor.assertMainToolbarButtonSelected('Spoiler');
            await wait.markupPreview('some text :spoiler[hidden]');
        });

        test('should add spoiler via toolbar @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');

            await editor.focus();
            await editor.press('ArrowDown');
            await editor.press('Enter');

            await editor.clickMainToolbarButton('Spoiler');
            await wait.timeout();
            await editor.pressSequentially('next');

            await expect(editor.getByTextInContenteditable(':spoiler[next]')).toBeVisible();
        });
    });

    test.describe('mode switch', () => {
        test('should keep spoilers after mode switch @wysiwyg @markup', async ({editor, wait}) => {
            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill(markup);
            await wait.timeout();

            await editor.switchMode('wysiwyg');

            const spoilers = editor.getBySelectorInContenteditable('.yfm-spoiler');
            await expect(spoilers).toHaveCount(6);
            await expect(spoilers.nth(1).locator('strong')).toHaveText('bold');
            await expect(spoilers.nth(1).locator('a')).toHaveText('a link');
            await expect(spoilers.nth(5).locator('br')).toHaveCount(1);
            // The serialized markup is the same as the source
            await wait.markupPreview(markup);

            await editor.switchMode('markup');
            await expect(
                editor.getByTextInContenteditable('With marks: :spoiler[**bold**'),
            ).toBeVisible();
        });
    });

    test.describe('view', () => {
        test('should hide text and show it while editing @wysiwyg', async ({
            editor,
            page,
            wait,
            expectScreenshot,
        }) => {
            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill(markup);
            await editor.switchMode('wysiwyg');
            await page.mouse.move(-1, -1);

            // The markup panel updates with a delay, so the screenshots skip it
            const editorArea = page.getByTestId('g-md-editor-mode');
            const content = editor.getBySelectorInContenteditable('.yfm-spoiler__content');

            // The editor can get the focus after the mode switch, so blur it until all text is hidden
            await expect(async () => {
                await editor.blur();
                for (const elem of await content.all()) {
                    await expect(elem).toHaveCSS('opacity', '0', {timeout: 500});
                }
            }).toPass();

            await expectScreenshot({component: editorArea, nameSuffix: 'hidden'});

            // The cursor inside the spoiler shows its text
            await content.nth(1).locator('strong').click();
            await page.mouse.move(-1, -1);
            await expect(content.nth(1)).toHaveCSS('opacity', '1');
            await expect(content.nth(0)).toHaveCSS('opacity', '0');
            await wait.timeout(300);

            await expectScreenshot({component: editorArea, nameSuffix: 'editing'});

            // The text stays editable and keeps the marks
            await editor.press('End');
            await editor.pressSequentially(' more');
            await wait.markupPreview(
                ':spoiler[**bold**, *italic* and [a link](https://example.com) more]',
            );

            // The text is hidden again when the cursor leaves the spoiler
            await editor.press('ArrowUp');
            await expect(content.nth(1)).toHaveCSS('opacity', '0');

            // and when the editor loses focus
            await content.nth(0).click();
            await expect(content.nth(0)).toHaveCSS('opacity', '1');
            await editor.blur();
            await expect(content.nth(0)).toHaveCSS('opacity', '0');
        });
    });

    test.describe('preview', () => {
        test('should show text by click and keyboard @markup', async ({
            editor,
            page,
            wait,
            expectScreenshot,
        }) => {
            await editor.switchMode('markup');
            await editor.clearContent();
            await editor.fill(markup);
            await editor.switchPreview('visible');
            await page.mouse.move(-1, -1);
            await wait.timeout(300);

            const preview = page.getByTestId('demo-md-preview');
            const spoilers = preview.locator('.yfm-spoiler');
            await expect(spoilers).toHaveCount(6);
            await expect(spoilers.first()).toHaveAttribute('role', 'button');
            await expect(spoilers.first()).toHaveAttribute('aria-label', 'Spoiler');

            await expectScreenshot({component: preview, nameSuffix: 'hidden'});

            // A click shows the text
            await spoilers.nth(0).click();
            await expect(spoilers.nth(0)).toHaveClass(/yfm-spoiler_revealed/);
            await expect(spoilers.nth(0)).not.toHaveAttribute('role');

            // A click on the hidden link shows the text and does not open the link
            const url = page.url();
            await spoilers.nth(1).locator('a').click();
            await expect(spoilers.nth(1)).toHaveClass(/yfm-spoiler_revealed/);
            expect(page.url()).toBe(url);

            // Enter and Space show the text too
            await spoilers.nth(2).focus();
            await page.keyboard.press('Enter');
            await expect(spoilers.nth(2)).toHaveClass(/yfm-spoiler_revealed/);
            await expect(spoilers.nth(2)).toBeFocused();

            await spoilers.nth(3).focus();
            await page.keyboard.press('Space');
            await expect(spoilers.nth(3)).toHaveClass(/yfm-spoiler_revealed/);

            await page.mouse.move(-1, -1);
            await wait.timeout(300);
            await expectScreenshot({component: preview, nameSuffix: 'revealed'});

            // The markup does not change
            await editor.switchPreview('hidden');
            await expect(
                editor.getByTextInContenteditable('Plain text: :spoiler[The answer is 42]'),
            ).toBeVisible();
        });
    });
});
