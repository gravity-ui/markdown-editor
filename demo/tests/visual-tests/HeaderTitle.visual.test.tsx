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

const sizesMarkup = inHeader(
    ...headerTitleSizes.map((size) => `::header-title[Title of size ${size}]{size="${size}"}`),
);
const colorsMarkup = inHeader(
    ...headerTitleColors.map(
        (color) => `::header-title[Title of the ${color} color]{color="${color}"}`,
    ),
    '::header-title[]',
);
const toolbarMarkup = `${inHeader('::header-title[Team portal]', 'Portal description.')}\n\nAfter`;

test.describe('Header title', () => {
    test('should render every size like the preview @wysiwyg', async ({
        mount,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={760} initial={`Before\n\n${sizesMarkup}`} />);
        await expect(headerTitle.blocks).toHaveCount(headerTitleSizes.length);
        expect(await headerTitle.getTypography(headerTitle.blocks)).toEqual(TYPOGRAPHY);
        expect(await headerTitle.getValues(headerTitle.blocks)).toEqual(
            headerTitleSizes.map((size) => ({
                size: String(size),
                color: 'auto',
                text: `Title of size ${size}`,
            })),
        );
        await expect(header.toolbar).toBeHidden();
        await expect(headerTitle.toolbar).toBeHidden();
        await expectScreenshot();
    });

    test('should render every color and the placeholder of an empty title @wysiwyg', async ({
        mount,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={760} initial={`Before\n\n${colorsMarkup}`} />);
        await expect(headerTitle.blocks).toHaveCount(headerTitleColors.length + 1);
        const values = await headerTitle.getValues(headerTitle.blocks);
        expect(values.slice(0, -1).map(({color}) => color)).toEqual([...headerTitleColors]);
        const colors = await headerTitle.getStyle('color', headerTitle.blocks);
        expect(new Set(colors.slice(0, -1)).size).toBe(headerTitleColors.length);
        await expect(headerTitle.placeholders).toHaveText(['Banner title']);
        await expect(header.toolbar).toBeHidden();
        await expect(headerTitle.toolbar).toBeHidden();
        await expectScreenshot();
    });

    test('should keep the titles when switching modes @wysiwyg @markup', async ({
        mount,
        editor,
        headerTitle,
    }) => {
        const titles = [
            '::header-title[Team portal]{size="1" color="red"}',
            '::header-title[Plain **text** \\[as\\] written]',
        ];
        const values = [
            {size: '1', color: 'red', text: 'Team portal'},
            {size: '2', color: 'auto', text: 'Plain **text** [as] written'},
        ];
        await mount(
            <HeaderStories.Header
                mode="markup"
                width={1000}
                initial={`${inHeader(titles[0], 'Text')}\n\n${titles[1]}`}
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
        headerTitle,
        wait,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Header width={760} initial={toolbarMarkup} />);
        await headerTitle.blocks.click();
        await expect(headerTitle.toolbar).toBeVisible();
        await expect(headerTitle.toolbar.getByRole('button')).toHaveCount(2);
        await expect(headerTitle.sizeButton).toHaveAccessibleName('Title size: Heading 2');
        await expect(headerTitle.colorButton).toHaveAccessibleName('Title color: Default');

        await headerTitle.sizeButton.click();
        await expect(headerTitle.menuItems).toHaveText(SIZE_NAMES);
        await headerTitle.menuItem('Heading 1').click();
        await expect(headerTitle.menu).toBeHidden();
        await expect(headerTitle.blocks).toHaveAttribute('aria-level', '1');
        await expect(headerTitle.sizeButton).toHaveAccessibleName('Title size: Heading 1');
        expect(await headerTitle.getTypography(headerTitle.blocks)).toEqual([TYPOGRAPHY[0]]);

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

    test('should open the size menu of the title toolbar with the keyboard @wysiwyg', async ({
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
        await page.keyboard.press('Escape');
        await expect(headerTitle.menu).toBeHidden();
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

    test('should turn the title off and on in the banner settings @wysiwyg', async ({
        mount,
        header,
        headerTitle,
        wait,
        expectScreenshot,
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

        await header.clickToggle('Title');
        await expect(header.toggle('Title')).toBeChecked();
        await expect(headerTitle.blocks).toHaveCount(1);
        await expect.poll(() => headerTitle.getMarkup()).toContain(`\n\n${title}\n\nText`);
        await header.setExpandedSections('Text');
        await wait.markupPreview(title);
        await expectScreenshot();

        await header.closeButton.click();
        await expect(header.settings).toBeHidden();
        await header.openSettings();
        await header.clickToggle('Title');
        await header.clickToggle('Title');
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
