import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/button';

import {buttonMarkup, buttonRowsMarkup, inHeader} from '../../src/stories/header/markup';

import {ButtonStories} from './Button.helpers';

// Lines under the button leave room for its settings window and style list in the screenshot.
const withSpace = `:button[Кнопка]{href="https://example.com" view="action" color="standard"}${'\n\nТекст'.repeat(12)}`;

// One button of every view in its default color and in a color of a family.
const stateStyles = [
    ['action', 'standard'],
    ['action', 'blue'],
    ['normal', 'gray'],
    ['normal', 'blue'],
    ['outline', 'gray'],
    ['outline', 'blue'],
    ['flat', 'standard'],
    ['flat', 'gray'],
    ['flat', 'blue'],
] as const;
const statesMarkup = stateStyles.map((style) => buttonMarkup(style)).join(' ');

const longLabel =
    'A long label that does not fit into one line of the column and wraps onto the next lines of the button';
const stressMarkup = [
    `:button[${longLabel}]{href="https://example.com" view="action" color="blue"}`,
    `:button[${'Unbreakable'.repeat(12)}]{href="https://example.com" view="normal" color="gray"}`,
    ':button[**Bold** _italic_ ~~strike~~ `code` <b>tag</b> &copy; &amp; \\[brackets\\] "quotes"]{href="https://example.com" view="outline" color="green"}',
    'Text before :button[One]{href="https://example.com" view="action" color="standard"} text between :button[Two]{href="https://example.com" view="outline" color="red"} and text after the buttons that goes on to the next line of the paragraph.',
    ':button[No address]{view="action" color="violet"} :button[No address]{view="normal" color="yellow"} :button[No address]{view="outline" color="gray"} :button[No address]{view="flat" color="standard"}',
    Array.from({length: 12}, (_, index) =>
        buttonMarkup(stateStyles[index % stateStyles.length], `Button ${index + 1}`),
    ).join(' '),
    ':button[A]{href="https://example.com" view="action" color="green"} :button[Кнопка]{href="https://example.com" view="normal" color="violet"} :button[Unknown values]{href="https://example.com" view="unknown" color="orange"}',
].join('\n\n');

test.describe('Button', () => {
    test('should take the colors from the theme @wysiwyg', async ({mount, button}) => {
        await mount(
            <ButtonStories.Button initial={':button[Кнопка]{view="action" color="blue"}'} />,
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
                    'Нажмите :button[Кнопка]{view="action" color="blue"} или :button[Кнопка]{view="outline" color="gray"} и читайте дальше'
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
        page,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button width={400} />);
        await button.openSettings();
        await button.label.fill('');
        await button.label.press('Enter');
        await expect(button.settings).toBeHidden();
        await expect(button.blocks).toHaveText('Button');
        // The pointer leaves the button, so the screenshot shows no hover state.
        await page.mouse.move(0, 0);
        await expectScreenshot({component: editor.locators.component});
        await editor.switchMode('markup');
        await expect(editor.locators.contenteditable).toContainText(':button[Button]');
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

    test('should edit the label and the link of a button in its window @wysiwyg', async ({
        mount,
        page,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await expect(button.label).toBeFocused();
        await expect(button.label).toHaveValue('Кнопка');
        await expect(button.link).toHaveValue('https://example.com');
        await page.mouse.move(0, 0);
        await expectScreenshot({component: editor.locators.component});
        await button.label.fill('Открыть');
        await button.link.fill('/page');
        await button.link.press('Enter');
        await expect(button.settings).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
        await expect(button.blocks).toHaveText('Открыть');
        await expect(button.blocks).toHaveAttribute('href', '/page');
        await editor.press('Enter');
        await expect(button.label).toBeFocused();
        await editor.press('Escape');
        await expect(button.settings).toBeHidden();
        await expect(editor.locators.contenteditable).toBeFocused();
    });

    test('should open settings on repeated clicks and preserve selection @wysiwyg', async ({
        mount,
        button,
        editor,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await expect(button.blocks).toHaveClass(/ProseMirror-selectednode/);
        await expect(button.blocks).toHaveCSS('outline-width', '2px');
        await expect(button.label).toBeFocused();
        expect(await button.getSettingsGeometry()).toEqual({
            width: 257,
            iconSize: [16, 16],
            iconLeft: 12,
            iconCenter: 0,
            textLeft: 36,
            swatchLeft: 8,
            fieldGap: 12,
        });
        await button.blocks.dblclick();
        await expect(button.label).toBeFocused();
        await expect(button.settings).toBeVisible();
        await button.label.press('Escape');
        await expect(button.settings).toBeHidden();
        await button.blocks.click();
        await expect(button.label).toBeFocused();
        await expect(button.blocks).toHaveClass(/ProseMirror-selectednode/);
        await editor.press('Escape');
    });

    test('should change the style of a button in its window @wysiwyg', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Button initial={withSpace} />);
        await button.openSettings();
        await button.styleSelect.click();
        await expect(button.option('Green')).toHaveCount(4);
        await button.option('Green').first().hover();
        await expect(button.preview).toBeVisible();
        await expectScreenshot({component: editor.locators.component});
        await button.option('Green').first().click();
        await expect(button.blocks).toHaveAttribute('data-view', 'action');
        await expect(button.blocks).toHaveAttribute('data-color', 'green');
        await button.newTab.click();
        await expect(button.blocks).toHaveAttribute('target', '_blank');
        await expect(button.settings).toBeVisible();
    });
});

test.describe('Button preview', () => {
    test('should render every view and color in the text and in a header @markup', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Preview />);
        await expect(button.variants).toHaveCount(50);
        // Each paragraph of buttons is a row, in the text and in the header.
        await expect(button.rows).toHaveCount(14);
        expect(await button.getFilledBackgrounds(button.variants)).not.toContain(
            'rgba(0, 0, 0, 0)',
        );
        await expectScreenshot({component: editor.locators.component});
    });

    test('should show the hover state of every view @markup', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Preview initial={statesMarkup} />);
        await expect(button.variants).toHaveCount(stateStyles.length);

        const action = button.variant('action', 'blue');
        const idle = await button.getBackground(action);
        await action.hover();
        await expect(action).not.toHaveCSS('background-color', idle);
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'action'});

        const normal = button.variant('normal', 'gray');
        const normalIdle = await button.getBackground(normal);
        await normal.hover();
        await expect(normal).not.toHaveCSS('background-color', normalIdle);
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'normal'});

        const outline = button.variant('outline', 'blue');
        await outline.hover();
        await expect(outline).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'outline'});

        const flat = button.variant('flat', 'gray');
        await flat.hover();
        await expect(flat).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'flat'});
    });

    test('should show the keyboard focus @markup', async ({
        mount,
        editor,
        button,
        wait,
        expectScreenshot,
    }) => {
        await mount(<ButtonStories.Preview initial={statesMarkup} />);
        await expect(button.variants).toHaveCount(stateStyles.length);

        const action = button.variant('action', 'blue');
        await button.focusWithKeyboard(action);
        await expect(action).toBeFocused();
        await expect(action).toHaveCSS('outline-style', 'solid');
        await wait.tooltipsHidden();
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'action'});

        const outline = button.variant('outline', 'blue');
        await button.focusWithKeyboard(outline);
        await expect(outline).toBeFocused();
        await expect(outline).toHaveCSS('outline-style', 'solid');
        await expectScreenshot({component: editor.locators.component, nameSuffix: 'outline'});
    });

    test('should wrap long labels and show labels as written @markup', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        await mount(
            <ButtonStories.Preview
                width={600}
                initial={`${stressMarkup}\n\n${inHeader(stressMarkup)}`}
            />,
        );
        await expect(button.variants).toHaveCount(48);
        await expect(button.variants.nth(2)).toHaveText(
            '**Bold** _italic_ ~~strike~~ `code` <b>tag</b> &copy; &amp; [brackets] "quotes"',
        );
        await expect(button.variants.filter({hasText: 'No address'}).first()).not.toHaveAttribute(
            'href',
        );
        await expectScreenshot({component: editor.locators.component});
    });
});

test.describe('Button on mobile', () => {
    test.use({viewport: {width: 343, height: 812}});

    test('should fit a narrow viewport @markup', async ({
        mount,
        editor,
        button,
        expectScreenshot,
    }) => {
        const markup = [
            buttonRowsMarkup(),
            `:button[${longLabel}]{href="https://example.com" view="action" color="blue"}`,
            inHeader(
                [
                    buttonMarkup(['action', 'blue']),
                    buttonMarkup(['normal', 'gray']),
                    buttonMarkup(['flat', 'standard']),
                ].join(' '),
            ),
        ].join('\n\n');
        await mount(<ButtonStories.Preview width={343} initial={markup} />, {
            rootStyle: {padding: 0},
        });
        await expect(button.variants).toHaveCount(29);
        expect(
            await editor.locators.previewContent.evaluate(
                (element) => element.scrollWidth <= element.clientWidth,
            ),
        ).toBe(true);
        await expectScreenshot({component: editor.locators.component});
    });
});
