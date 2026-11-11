import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {HeaderStories} from './Header.helpers';

test.describe('Button', () => {
    test('should render every view and color @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.ButtonColors width={760} />);
        await expect(button.blocks).toHaveCount(25);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should show the placeholder in an empty button @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={660} initial={':::button\n:::\n\nAfter'} />);
        await expect(button.blocks).toHaveText('Button');
        await expectScreenshot({component: editor.locators.component});
    });
});
