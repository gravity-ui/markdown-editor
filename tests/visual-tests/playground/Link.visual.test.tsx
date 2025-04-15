import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test.describe('Link', () => {
    test.beforeEach(async ({mount}) => {
        const initialMarkup = ``;

        await mount(<Playground initial={initialMarkup} />);
    });

    test('should insert link via toolbar popup dialog', async ({editor, page, actions, wait}) => {
        await editor.switchMode('wysiwyg');
        await editor.clickToolbarMoreActionButton();

        const linkButton = page.getByText('Link');
        await wait.visible(linkButton);

        await linkButton.click();
        await expect(page.getByTestId('g-md-link-form')).toBeVisible();

        // Expect that the focused element is an input inside the link popup
        await wait.timeout(300);
        await actions.fillFocused('gravity-ui.com');
        await actions.pressFocused('Tab');
        await actions.pressFocused('Tab');
        await actions.pressFocused('Tab');

        await actions.fillFocused('gravity');
        await actions.pressFocused('Enter');

        await expect(editor.getByTextInContenteditable('gravity-ui.com')).toBeHidden();
        await expect(editor.getByTextInContenteditable('gravity')).toBeVisible();
    });
});
