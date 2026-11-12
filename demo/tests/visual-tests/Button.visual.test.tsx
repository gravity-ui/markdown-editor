import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {ButtonStories} from './Button.helpers';
import {HeaderStories} from './Header.helpers';

test.describe('Button', () => {
    test('should render every view and color', async ({mount, button, expectScreenshot}) => {
        await mount(<ButtonStories.Colors />);
        await expect(button.variants).toHaveCount(25);
        await expect(button.preview).toHaveCSS('grid-template-columns', '80px 80px 80px 80px');
        await expectScreenshot({component: button.preview});
    });

    test('should render a standalone button', async ({mount, button, expectScreenshot}) => {
        await mount(<ButtonStories.Button />);
        await expect(button.variants).toHaveCount(1);
        await expect(button.variants).toHaveAttribute('href', 'https://example.com');
        await expectScreenshot({component: button.preview});
    });

    test('should show the placeholder in an empty button @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header initial={':::button\n:::\n\nAfter'} width={400} />);
        await expect(button.blocks).toHaveText('Button');
        await expectScreenshot({component: editor.locators.component});
    });
});
