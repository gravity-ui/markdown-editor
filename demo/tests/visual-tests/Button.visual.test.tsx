import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {ButtonStories} from './Button.helpers';

// Lines under the button leave room for its panel and style window in the screenshot.
const withSpace = `:button[Кнопка]{href="https://example.com" view="action" color="standard"}${'\n\nТекст'.repeat(8)}`;

test.describe('Button', () => {
    test('should take the colors from the theme @wysiwyg', async ({mount, button}) => {
        await mount(
            <ButtonStories.Button initial={':button[Кнопка]{view="action" color="info"}'} />,
        );
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
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render a button @wysiwyg', async ({mount, editor, button, expectScreenshot}) => {
        await mount(<ButtonStories.Button />);
        await editor.assertMode('wysiwyg');
        await expect(button.blocks).toHaveCount(1);
        await expect(button.blocks).toHaveAttribute('href', 'https://example.com');
        await expectScreenshot({component: editor.locators.component});
    });

    test('should place buttons in a line of text @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(
            <ButtonStories.Button
                initial={
                    'Нажмите :button[Кнопка]{view="action" color="info"} или :button[Кнопка]{view="outline" color="gray"} и читайте дальше'
                }
            />,
        );
        await expect(button.blocks).toHaveCount(2);
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
        expect(await button.getValues(button.variants)).toEqual(before);
        await expectScreenshot({component: editor.locators.component});
        await editor.switchMode('wysiwyg');
        await expect(button.blocks).toHaveCount(25);
        expect(await button.getValues()).toEqual(before);
    });

    test('should preview a button @markup', async ({
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
        await mount(<ButtonStories.Button width={400} />);
        await editor.selectTextIn('.g-md-button-plugin');
        await editor.press('Backspace');
        await expect(button.blocks).toHaveText('Button');
        await editor.switchMode('markup');
        await expect(editor.locators.contenteditable).toContainText(':button[Button]');
        await editor.switchMode('wysiwyg');
        await button.blocks.first().waitFor();
        await editor.selectTextIn('.g-md-button-plugin');
        await editor.press('Backspace');
        await editor.press('Escape');
        await expect(button.toolbar).toBeHidden();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should insert a button from the toolbar @wysiwyg', async ({
        mount,
        page,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial="Текст " />);
        await editor.focus();
        await editor.press('End');
        await editor.clickMainToolbarButton('Button');
        await expect(button.blocks).toHaveCount(1);
        await expect(button.blocks).toHaveText('Button');
        await expect(button.blocks).toHaveAttribute('data-view', 'action');
        await expect(button.blocks).toHaveAttribute('data-color', 'standard');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should insert a button from the toolbar @markup', async ({mount, editor}) => {
        await mount(<ButtonStories.Button initial="" mode="markup" />);
        await editor.clickMainToolbarButton('Button');
        await expect(editor.locators.contenteditable).toHaveText(
            ':button[Button]{view="action" color="standard"}',
        );
    });

    test('should edit the link of a button in its panel @wysiwyg', async ({
        mount,
        page,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.focus();
        await expect(button.link).toHaveValue('https://example.com');
        await page.mouse.move(0, 0);
        await expectScreenshot({component: editor.locators.component});
        await button.link.fill('/page');
        await button.link.press('Enter');
        await expect(button.blocks).toHaveAttribute('href', '/page');
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    test('should change the style of a button in its window @wysiwyg', async ({
        mount,
        page,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.focus();
        await button.styleButton.click();
        await expect(button.style).toBeVisible();
        await button.styleSelect.click();
        await page.mouse.move(0, 0);
        await expectScreenshot({component: editor.locators.component});
        await page.getByRole('option', {name: 'Green'}).first().click();
        await expect(button.blocks).toHaveAttribute('data-color', 'green');
        await button.style.getByText('Open in a new tab', {exact: true}).click();
        await expect(button.blocks).toHaveAttribute('target', '_blank');
    });
});
