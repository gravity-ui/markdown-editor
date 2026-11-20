import {headerTitleColors, headerTitleSizes} from '@gravity-ui/markdown-plugin-header';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-title';

import {HeaderStories} from './Header.helpers';

const inHeader = (...blocks: string[]) =>
    [':::header{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

const TYPOGRAPHY = [
    ['32px', '40px', '600'],
    ['24px', '28px', '600'],
    ['20px', '24px', '600'],
    ['17px', '24px', '600'],
    ['15px', '20px', '600'],
    ['13px', '18px', '600'],
];
const SIZE_NAMES = headerTitleSizes.map((size) => `Heading ${size}`);
const COLOR_NAMES = ['Default', 'Gray', 'Yellow', 'Orange', 'Red', 'Green', 'Blue', 'Violet'];

const stylesMarkup = [
    ...headerTitleSizes.map((size) => inHeader(`::header-title[Size ${size}]{size="${size}"}`)),
    ...headerTitleColors.map((color) =>
        inHeader(`::header-title[Color ${color}]{color="${color}"}`),
    ),
].join('\n\n');
const longTitle =
    'A long banner title that takes more than one line in a banner of the medium width';
const unbreakableTitle = 'Unbreakable'.repeat(12);
const toolbarMarkup = `${inHeader('::header-title[Team portal]', 'Portal description.')}\n\nAfter`;

test.describe('Header title', () => {
    test('should render the title variants @wysiwyg', async ({
        mount,
        page,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Title width={760} />);
        await expect(headerTitle.blocks).toHaveCount(3);
        await expect(headerTitle.placeholders).toHaveText(['Banner title']);
        await header.hideToolbar();
        await page.keyboard.press('Escape');
        await expect(headerTitle.toolbar).toBeHidden();
        await expectScreenshot();
    });

    test('should render every size and color like the preview @wysiwyg @markup', async ({
        mount,
        editor,
        headerTitle,
    }) => {
        await mount(<HeaderStories.Header mode="markup" width={760} initial={stylesMarkup} />);
        await editor.switchPreview('visible');
        const count = headerTitleSizes.length + headerTitleColors.length;
        await expect(headerTitle.previews).toHaveCount(count);
        const previews = await headerTitle.getStyles();
        await editor.switchMode('wysiwyg');
        await expect(headerTitle.blocks).toHaveCount(count);
        const blocks = await headerTitle.getStyles(headerTitle.blocks);
        expect(blocks).toEqual(previews);
        expect(
            blocks
                .slice(0, headerTitleSizes.length)
                .map(({fontSize, lineHeight, fontWeight}) => [fontSize, lineHeight, fontWeight]),
        ).toEqual(TYPOGRAPHY);
        const colors = blocks.slice(headerTitleSizes.length).map(({color}) => color);
        expect(new Set(colors).size).toBe(headerTitleColors.length);
    });

    test('should wrap a long title without scrolling @wysiwyg', async ({mount, headerTitle}) => {
        await mount(
            <HeaderStories.Header
                width={760}
                initial={[
                    inHeader(`::header-title[${longTitle}]{size="1"}`),
                    inHeader(`::header-title[${unbreakableTitle}]`),
                ].join('\n\n')}
            />,
        );
        await expect(headerTitle.blocks).toHaveText([longTitle, unbreakableTitle]);
        const lines = await headerTitle.getLineCounts();
        expect(lines.every((count) => count > 1)).toBe(true);
        expect(await headerTitle.hasHorizontalScroll()).toBe(false);
    });

    test('should keep the titles when switching modes @wysiwyg @markup', async ({
        mount,
        editor,
        headerTitle,
    }) => {
        const titles = [
            '::header-title[Team portal]{size="1" color="red"}',
            '::header-title[Release notes]',
        ];
        const values = [
            {size: '1', color: 'red', text: 'Team portal'},
            {size: '2', color: 'auto', text: 'Release notes'},
        ];
        await mount(
            <HeaderStories.Header
                mode="markup"
                width={1000}
                initial={`${inHeader(titles[0], 'Text')}\n\n${inHeader(titles[1])}`}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expect(headerTitle.blocks).toHaveCount(2);
        expect(await headerTitle.getValues(headerTitle.blocks)).toEqual(values);
        await editor.switchMode('markup');
        const markup = await headerTitle.getMarkup();
        expect(markup).toContain(titles[0]);
        expect(markup).toContain(titles[1]);
        await editor.switchPreview('visible');
        await expect(headerTitle.previews).toHaveCount(2);
        expect(await headerTitle.getValues()).toEqual(values);
    });

    test('should change the size and the color with the title toolbar @wysiwyg', async ({
        mount,
        page,
        editor,
        headerTitle,
        wait,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={760} initial={toolbarMarkup} />);
        await headerTitle.blocks.click();
        await expect(headerTitle.toolbar).toBeVisible();
        const [main, toolbar] = await Promise.all([
            editor.locators.toolbars.main.boundingBox(),
            headerTitle.toolbar.boundingBox(),
        ]);
        expect(toolbar!.y).toBeGreaterThanOrEqual(main!.y + main!.height);
        await expect(headerTitle.toolbar.getByRole('button')).toHaveCount(2);
        await expect(headerTitle.sizeButton).toHaveAccessibleName('Title size: Heading 2');
        await expect(headerTitle.colorButton).toHaveAccessibleName('Title color: Default');

        await headerTitle.sizeButton.click();
        await expect(headerTitle.menuItems).toHaveText(SIZE_NAMES);
        await headerTitle.menuItem('Heading 1').click();
        await expect(headerTitle.menu).toBeHidden();
        await expect(headerTitle.blocks).toHaveAttribute('data-size', '1');
        await expect(headerTitle.sizeButton).toHaveAccessibleName('Title size: Heading 1');

        await headerTitle.colorButton.click();
        await expect(headerTitle.menuItems).toHaveText(COLOR_NAMES);
        await headerTitle.menuItem('Red').click();
        await expect(headerTitle.menu).toBeHidden();
        await expect(headerTitle.blocks).toHaveAttribute('data-color', 'red');
        await expect(headerTitle.colorButton).toHaveAccessibleName('Title color: Red');
        await expect
            .poll(() => headerTitle.getMarkup())
            .toContain('::header-title[Team portal]{size="1" color="red"}');
        await wait.markupPreview('::header-title[Team portal]{size="1" color="red"}');
        await page.mouse.move(0, 0);
        await wait.tooltipsHidden();
        await expectScreenshot();
    });

    test('should choose a size of the title toolbar with the keyboard @wysiwyg', async ({
        mount,
        page,
        editor,
        headerTitle,
    }) => {
        await mount(<HeaderStories.Header width={760} initial={toolbarMarkup} />);
        await headerTitle.blocks.click();
        await editor.press('End');
        await expect(headerTitle.toolbar).toBeVisible();
        await editor.press('Tab');
        await expect(headerTitle.sizeButton).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(headerTitle.menuItems).toHaveText(SIZE_NAMES);
        await page.keyboard.press('Tab');
        await expect(headerTitle.menuItem('Heading 1')).toBeFocused();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(headerTitle.menuItem('Heading 3')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(headerTitle.menu).toBeHidden();
        await expect(headerTitle.blocks).toHaveAttribute('data-size', '3');
        await expect(editor.locators.contenteditable).toBeFocused();

        await editor.press('Tab');
        await expect(headerTitle.sizeButton).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(headerTitle.menuItems).toHaveText(SIZE_NAMES);
        await page.keyboard.press('Escape');
        await expect(headerTitle.menu).toBeHidden();
        await expect(headerTitle.toolbar).toBeVisible();
        await expect(headerTitle.sizeButton).toBeFocused();
    });

    test('should keep one title on Enter and on block shortcuts @wysiwyg', async ({
        mount,
        editor,
        headerTitle,
    }) => {
        await mount(<HeaderStories.Header width={760} initial={toolbarMarkup} />);
        await headerTitle.blocks.click();
        await editor.press('End');
        await editor.pressSequentially(' and news');
        await editor.press('Enter');
        await editor.press('ControlOrMeta+Alt+1');
        await editor.pressSequentially('# ');
        await expect(headerTitle.blocks).toHaveCount(1);
        await expect(headerTitle.blocks).toHaveText('Team portal and news# ');
        await expect
            .poll(() => headerTitle.getMarkup())
            .toContain('::header-title[Team portal and news#]\n');
    });

    test('should restore the title turned off in the banner settings @wysiwyg', async ({
        mount,
        header,
        headerTitle,
    }) => {
        const title = '::header-title[Team portal]{size="1" color="blue"}';
        await mount(<HeaderStories.Header width={760} initial={inHeader(title, 'Text')} />);
        await headerTitle.blocks.click();
        await header.openSettings();
        await expect(header.toggle('Title')).toBeChecked();

        await header.clickToggle('Title');
        await expect(header.toggle('Title')).not.toBeChecked();
        await expect(headerTitle.blocks).toHaveCount(0);
        await expect.poll(() => headerTitle.getMarkup()).not.toContain('::header-title');

        await header.closeButton.click();
        await expect(header.settings).toBeHidden();
        await header.openSettings();
        await header.clickToggle('Title');
        await expect(header.toggle('Title')).toBeChecked();
        await expect(headerTitle.blocks).toHaveCount(1);
        await expect.poll(() => headerTitle.getMarkup()).toContain(`\n\n${title}\n\nText`);
    });

    test('should insert the default title from the banner settings @wysiwyg', async ({
        mount,
        header,
        headerTitle,
    }) => {
        await mount(<HeaderStories.Header width={760} initial={inHeader('First', 'Second')} />);
        await header.blocks.getByText('First').click();
        await header.openSettings();
        await expect(header.toggle('Title')).not.toBeChecked();
        await header.clickToggle('Title');
        await expect(headerTitle.blocks).toHaveText('This is your start page');
        await expect
            .poll(() => headerTitle.getMarkup())
            .toContain('\n\n::header-title[This is your start page]\n\nFirst\n\nSecond');
    });
});
