import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Preview submission', () => {
    test('should submit from preview @markup', async ({mount, editor, page}) => {
        await mount(
            <Playground
                initial="Preview submission"
                initialEditor="markup"
                initialSplitModeEnabled={false}
                enableSubmitInPreview
            />,
        );

        await editor.switchPreview('visible');
        await expect(editor.locators.component).toBeFocused();
        const messages: string[] = [];
        page.on('dialog', async (dialog) => {
            messages.push(dialog.message());
            await dialog.dismiss();
        });

        await page.keyboard.press('Control+Enter');
        await expect.poll(() => messages).toEqual(['Editor: submit']);
    });
});
