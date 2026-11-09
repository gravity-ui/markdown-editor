import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Markup emoji', () => {
    test.beforeEach(async ({mount}) => {
        await mount(<Playground initial="" initialEditor="markup" directiveSyntax="enabled" />, {
            hidePlaygroundBlocks: true,
            width: '100%',
            rootStyle: {width: '100%', height: '100%', padding: 0},
        });
    });

    test('should switch from emoji to directive suggestions at the second colon', async ({
        editor,
    }) => {
        const options = editor.locators.cmAutocomplete.getByRole('option');
        const cut = options.filter({hasText: 'YFM Cut'});

        await editor.pressSequentially(':');
        await expect(options.first()).toBeVisible();
        await expect(cut).toHaveCount(0);

        await editor.pressSequentially(':');
        await expect(options).toHaveCount(1);
        await expect(cut).toBeVisible();
    });

    test('should insert an emoji from the toolbar', async ({editor}) => {
        await editor.pressSequentially('Hello');
        await editor.openMainToolbarMoreMenu();
        await editor.locators.toolbars.additional.getByLabel('Emoji', {exact: true}).click();
        await expect(editor.locators.contenteditable).toHaveText('Hello:');

        await editor.pressSequentially('smi');
        await editor.locators.cmAutocomplete
            .getByRole('option')
            .filter({hasText: ':smile:'})
            .click();

        await expect(editor.locators.contenteditable).toHaveText('Hello:smile:');
    });
});
