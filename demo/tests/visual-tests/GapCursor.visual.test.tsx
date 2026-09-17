import {expect, test} from 'playwright/core';

import {GapCursorEditor} from './GapCursor.helpers';

const cases = [
    {text: 'Second', edge: 'Home', arrow: 'ArrowUp', index: 1},
    {text: 'First', edge: 'End', arrow: 'ArrowDown', index: 1},
    {text: 'First', edge: 'Home', arrow: 'ArrowUp', index: 0},
    {text: 'Second', edge: 'End', arrow: 'ArrowDown', index: 2},
] as const;

test.describe('Gap cursor with nested block toolbars', () => {
    for (const {text, edge, arrow, index} of cases) {
        test(`${arrow} from ${text} inserts text in the parent`, async ({mount, page}) => {
            const errors: string[] = [];
            page.on('pageerror', (error) => errors.push(error.message));
            await mount(<GapCursorEditor />);
            const editor = page.locator('.ProseMirror');
            const parent = editor.locator(':scope > blockquote');
            const toolbar = page.getByTestId('block-toolbar');
            const probe = page.getByTestId('gap-probe');

            await editor.getByText(text, {exact: true}).click();
            await editor.press(edge);
            await expect(toolbar).toHaveText(text);
            await editor.press(arrow);

            // Observe beyond the first frame: popup effects used to trigger a DOM reparse
            // that replaced the gap selection with a text selection inside the child.
            await page.waitForTimeout(250);
            await expect(toolbar).toHaveText('FirstSecond');
            await expect(probe).toContainText('"type":"gap"');
            await expect(parent.locator(':scope > .g-md-gapcursor')).toHaveCount(1);
            await expect(editor).toBeFocused();

            await editor.pressSequentially('Inserted');
            await expect(parent.locator(':scope > p')).toHaveText('Inserted');
            await expect(parent.locator(':scope > blockquote')).toHaveText(['First', 'Second']);
            expect(
                await parent.evaluate((element) =>
                    Array.from(element.children).map((child) => child.textContent),
                ),
            ).toEqual(['First', 'Second'].toSpliced(index, 0, 'Inserted'));

            await editor.press('Control+z');
            await expect(parent.locator(':scope > p:not(.g-md-gapcursor)')).toHaveCount(0);
            await expect(parent.locator(':scope > blockquote')).toHaveText(['First', 'Second']);
            await expect(editor.locator(':scope > p')).toHaveText(['Before', 'After']);
            expect(errors).toEqual([]);
        });
    }

    test('continues through the gap to the previous child without inserting a paragraph', async ({
        mount,
        page,
    }) => {
        await mount(<GapCursorEditor />);
        const editor = page.locator('.ProseMirror');
        const probe = page.getByTestId('gap-probe');
        await editor.getByText('Second', {exact: true}).click();
        await editor.press('Home');
        await editor.press('ArrowUp');
        await page.waitForTimeout(250);
        await expect(probe).toContainText('"type":"gap"');

        await editor.press('ArrowUp');
        await expect(probe).toContainText('"parentText":"First"');
        await expect(probe).toContainText('"type":"text"');
        await expect(editor.locator(':scope > blockquote > p')).toHaveCount(0);
        await expect(editor.locator(':scope > blockquote > blockquote')).toHaveText([
            'First',
            'Second',
        ]);
    });
});
