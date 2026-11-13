import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {ButtonStories} from './Button.helpers';

test.describe('Button', () => {
    test('should take the colors from the theme @wysiwyg', async ({mount, button}) => {
        await mount(<ButtonStories.Button initial={':::button{color="info"}\nКнопка\n:::'} />);
        await expect(button.blocks).toHaveCount(1);
        await button.setThemeVariable('--g-color-base-info-heavy', 'rgb(100, 110, 120)');
        await expect(button.blocks).toHaveCSS('background-color', 'rgb(100, 110, 120)');
    });

    test('should render every view and color @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Colors />);
        await editor.assertMode('wysiwyg');
        await expect(button.blocks).toHaveCount(25);
        expect(await button.getFilledBackgrounds()).not.toContain('rgba(0, 0, 0, 0)');
        await expect(button.content).toHaveCSS('grid-template-columns', '80px 80px 80px 80px');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render a standalone button @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button />);
        await editor.assertMode('wysiwyg');
        await expect(button.blocks).toHaveCount(1);
        await expect(button.blocks).toHaveAttribute('href', 'https://example.com');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should place adjacent buttons in a row @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(
            <ButtonStories.Button
                initial={':::button\nКнопка\n:::\n\n:::button{view="outline"}\nКнопка\n:::'}
            />,
        );
        await expect(button.blocks).toHaveCount(2);
        await expect(button.blocks.nth(1)).toHaveCSS('margin-inline-start', '16px');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should preview every view and color and preserve them across modes @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Colors />);
        await expect(button.blocks).toHaveCount(25);
        const before = await button.getValues();
        await editor.switchMode('markup');
        await editor.switchPreview('visible');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expect(button.variants).toHaveCount(25);
        expect(await button.getFilledBackgrounds(button.variants)).not.toContain(
            'rgba(0, 0, 0, 0)',
        );
        await expect(editor.locators.previewContent).toHaveCSS(
            'grid-template-columns',
            '80px 80px 80px 80px',
        );
        expect(await button.getValues(button.variants)).toEqual(before);
        await expectScreenshot({component: editor.locators.component});
        await editor.switchMode('wysiwyg');
        await expect(button.blocks).toHaveCount(25);
        expect(await button.getValues()).toEqual(before);
    });

    test('should preview a standalone button @markup', async ({
        mount,
        page,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button mode="markup" />);
        await editor.switchPreview('visible');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expect(button.variants).toHaveCount(1);
        await expect(button.variants).toHaveAttribute('href', 'https://example.com');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should show the placeholder in an empty button @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={':::button\n:::\n\nAfter'} width={400} />);
        await expect(button.blocks).toHaveText('Button');
        await expectScreenshot({component: editor.locators.component});
    });
});
