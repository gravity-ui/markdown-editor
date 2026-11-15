import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/gpt';

import {GptEditor} from './GPT.helpers';

test.describe('GPT', () => {
    test('should replace selected text and support undo @wysiwyg', async ({
        mount,
        editor,
        gpt,
        page,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 800, height: 200});
        await mount(<GptEditor />, {width: 760});
        await editor.press('ControlOrMeta+a');
        await gpt.open();
        await page.mouse.move(0, 0);
        await expect(page.getByRole('tooltip')).toBeHidden();
        await expectScreenshot({fullPage: true, nameSuffix: 'prompt'});
        await page.setViewportSize({width: 800, height: 280});
        await gpt.uppercase();
        await page.mouse.move(0, 0);
        await expect(page.getByRole('tooltip')).toBeHidden();
        await expectScreenshot({fullPage: true, nameSuffix: 'answer'});
        await gpt.apply();
        await expect(editor.locators.contenteditable).toHaveText('ORIGINAL TEXT');
        await expect(gpt.applied).toHaveText('ORIGINAL TEXT');
        await editor.press('ControlOrMeta+z');
        await expect(editor.locators.contenteditable).toHaveText('original text');
    });
    test('should replace selected text and support undo @markup', async ({
        mount,
        editor,
        gpt,
        page,
        expectScreenshot,
    }) => {
        await page.setViewportSize({width: 800, height: 200});
        await mount(<GptEditor />, {width: 760});
        await editor.switchMode('markup');
        await editor.press('ControlOrMeta+a');
        await gpt.open();
        await page.mouse.move(0, 0);
        await expect(page.getByRole('tooltip')).toBeHidden();
        await expectScreenshot({fullPage: true, nameSuffix: 'prompt'});
        await page.setViewportSize({width: 800, height: 280});
        await gpt.uppercase();
        await page.mouse.move(0, 0);
        await expect(page.getByRole('tooltip')).toBeHidden();
        await expectScreenshot({fullPage: true, nameSuffix: 'answer'});
        await gpt.apply();
        await expect(editor.locators.contenteditable).toHaveText('ORIGINAL TEXT');
        await expect(gpt.applied).toHaveText('ORIGINAL TEXT');
        await editor.press('ControlOrMeta+z');
        await expect(editor.locators.contenteditable).toHaveText('original text');
    });
    test('should preserve scroll and reset on reopen @wysiwyg', async ({
        mount,
        editor,
        gpt,
        page,
    }) => {
        await mount(<GptEditor />, {width: 760, rootStyle: {paddingTop: 900, paddingBottom: 900}});
        await gpt.button.scrollIntoViewIfNeeded();
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThan(0);
        await gpt.open();
        await gpt.input.fill('draft');
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
        await gpt.close();
        await expect(editor.locators.contenteditable).toBeFocused();
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
        await gpt.open();
        await expect(gpt.input).toHaveValue('');
    });
    test('should preserve scroll and reset on reopen @markup', async ({
        mount,
        editor,
        gpt,
        page,
    }) => {
        await mount(<GptEditor />, {width: 760, rootStyle: {paddingTop: 900, paddingBottom: 900}});
        await editor.switchMode('markup');
        await gpt.button.scrollIntoViewIfNeeded();
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeGreaterThan(0);
        await gpt.open();
        await gpt.input.fill('draft');
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
        await gpt.close();
        await expect(editor.locators.contenteditable).toBeFocused();
        expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
        await gpt.open();
        await expect(gpt.input).toHaveValue('');
    });
    test('should recover from errors and constrain a long answer @wysiwyg', async ({
        mount,
        editor,
        gpt,
        page,
    }) => {
        await page.setViewportSize({width: 600, height: 440});
        await mount(<GptEditor />, {width: 560});
        await editor.press('ControlOrMeta+a');
        await gpt.open();
        await gpt.submit('fail');
        await gpt.retry();
        await gpt.close();
        await gpt.open();
        await gpt.submit('long');
        await expect(gpt.answer).toContainText('Long answer.');
        await gpt.expectInsideViewport();
    });
    test('should recover from errors and constrain a long answer @markup', async ({
        mount,
        editor,
        gpt,
        page,
    }) => {
        await page.setViewportSize({width: 600, height: 440});
        await mount(<GptEditor />, {width: 560});
        await editor.switchMode('markup');
        await editor.press('ControlOrMeta+a');
        await gpt.open();
        await gpt.submit('fail');
        await gpt.retry();
        await gpt.close();
        await gpt.open();
        await gpt.submit('long');
        await expect(gpt.answer).toContainText('Long answer.');
        await gpt.expectInsideViewport();
    });
    test('should ignore a pending answer after editing the document @wysiwyg', async ({
        mount,
        editor,
        gpt,
    }) => {
        await mount(<GptEditor slow />, {width: 760});
        await editor.press('ControlOrMeta+a');
        await gpt.open();
        await gpt.submit('slow');
        await editor.fill('changed text');
        await expect(gpt.completed).toHaveText('1');
        await expect(gpt.dialog).toBeHidden();
        await expect(gpt.updates).toHaveText('0');
        await expect(editor.locators.contenteditable).toHaveText('changed text');
    });
    test('should ignore a pending answer after editing the document @markup', async ({
        mount,
        editor,
        gpt,
    }) => {
        await mount(<GptEditor slow />, {width: 760});
        await editor.switchMode('markup');
        await editor.press('ControlOrMeta+a');
        await gpt.open();
        await gpt.submit('slow');
        await editor.fill('changed text');
        await expect(gpt.completed).toHaveText('1');
        await expect(gpt.dialog).toBeHidden();
        await expect(gpt.updates).toHaveText('0');
        await expect(editor.locators.contenteditable).toHaveText('changed text');
    });
});
