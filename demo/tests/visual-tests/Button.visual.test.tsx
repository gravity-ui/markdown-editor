import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {ButtonStories} from './Button.helpers';

test.describe('Button', () => {
    test('should render every view and color @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Colors />);
        await expect(button.blocks).toHaveCount(25);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should show the placeholder in an empty button @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={':::button\n:::\n\nAfter'} />);
        await expect(button.blocks).toHaveText('Button');
        await expectScreenshot({component: editor.locators.component});
    });
});
