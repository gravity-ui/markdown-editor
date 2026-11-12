import {buttonPlugin} from '@gravity-ui/markdown-plugin-header';
import MarkdownIt from 'markdown-it';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {ButtonStories} from './Button.helpers';

test.describe('Button', () => {
    test('should preserve host styles and inherit the host theme @markup', async ({
        page,
        button,
    }) => {
        const md = new MarkdownIt().use(buttonPlugin);
        await button.setHostContent(md.render(':::button{color="blue"}\nAction\n:::'));
        const before = await button.getHostStyle();

        await page.addStyleTag({
            path: require.resolve('@gravity-ui/markdown-plugin-header/styles.css'),
        });

        expect(await button.getHostStyle()).toEqual(before);
        await expect(button.variants).toHaveCSS('background-color', 'rgb(12, 34, 56)');
        await expect(button.variants).toHaveCSS('color', 'rgb(240, 241, 242)');
        await expect(button.variants).toHaveCSS('border-radius', '7px');

        await button.setHostBrand('rgb(100, 110, 120)');
        await expect(button.variants).toHaveCSS('background-color', 'rgb(100, 110, 120)');
        await expect(button.hostControl).toHaveCSS('background-color', 'rgb(100, 110, 120)');
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

    test('should preview every view and color and preserve them across modes @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Colors />);
        const before = await button.getValues();
        await editor.switchMode('markup');
        await editor.switchPreview('visible');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expect(button.variants).toHaveCount(25);
        expect(await button.getFilledBackgrounds(button.variants)).not.toContain(
            'rgba(0, 0, 0, 0)',
        );
        await expect(button.preview).toHaveCSS('grid-template-columns', '80px 80px 80px 80px');
        expect(await button.getValues(button.variants)).toEqual(before);
        await expectScreenshot({component: editor.locators.component});
        await editor.switchMode('wysiwyg');
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
