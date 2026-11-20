import type {CSSProperties} from 'react';

import {headerTitleColors, headerTitleSizes} from '@gravity-ui/markdown-plugin-header';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-title';

import {HeaderStories} from './Header.helpers';

const inHeader = (...blocks: string[]) =>
    [':::header{height="s" width="m"}', ...blocks, ':::'].join('\n\n');

// A low banner keeps the screenshots small; the title sets the height of the banner.
const lowHeader = {'--g-md-header-plugin-height-s': '0px'} as CSSProperties;

const TYPOGRAPHY = [
    ['32px', '40px', '600'],
    ['24px', '28px', '600'],
    ['20px', '24px', '600'],
    ['17px', '24px', '600'],
    ['15px', '20px', '600'],
    ['13px', '18px', '600'],
];

const stylesMarkup = [
    ...headerTitleSizes.map((size) => `::header-title[Size ${size}]{size="${size}"}`),
    ...headerTitleColors.map((color) => `::header-title[Color ${color}]{color="${color}"}`),
].join('\n\n');

const longTitle =
    'A long banner title that takes more than one line in a banner of the medium width';
const unbreakableTitle = 'Unbreakable'.repeat(12);

test.describe('Header title preview', () => {
    test('should render every size and color @markup', async ({
        mount,
        editor,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderStories.Title mode="markup" width={760} initial={stylesMarkup} />);
        await editor.switchPreview('visible');
        await expect(headerTitle.previews).toHaveCount(
            headerTitleSizes.length + headerTitleColors.length,
        );
        const styles = await headerTitle.getStyles();
        expect(
            styles
                .slice(0, headerTitleSizes.length)
                .map(({fontSize, lineHeight, fontWeight}) => [fontSize, lineHeight, fontWeight]),
        ).toEqual(TYPOGRAPHY);
        const colors = styles.slice(headerTitleSizes.length).map(({color}) => color);
        expect(new Set(colors).size).toBe(headerTitleColors.length);
        await expectScreenshot({component: editor.locators.previewContent});
    });

    test('should render one title per banner and keep a second one as text @markup', async ({
        mount,
        editor,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(
            <div style={lowHeader}>
                <HeaderStories.Title
                    mode="markup"
                    width={760}
                    initial={[
                        inHeader(
                            '::header-title[Team portal]{size="1" color="blue"}',
                            '::header-title[Second title]',
                        ),
                        inHeader('::header-title[]', 'Text after an empty title'),
                        '::header-title[Outside a banner]{size="4"}',
                    ].join('\n\n')}
                />
            </div>,
        );
        await editor.switchPreview('visible');
        expect(await headerTitle.getValues()).toEqual([
            {size: '1', color: 'blue', text: 'Team portal'},
            {size: '4', color: 'auto', text: 'Outside a banner'},
        ]);
        await expect(editor.locators.previewContent).toContainText('::header-title[Second title]');
        await expectScreenshot({component: editor.locators.previewContent});
    });

    test('should wrap a long title without scrolling @markup', async ({
        mount,
        editor,
        headerTitle,
    }) => {
        await mount(
            <HeaderStories.Title
                mode="markup"
                width={760}
                initial={[
                    inHeader(`::header-title[${longTitle}]{size="1"}`),
                    inHeader(`::header-title[${unbreakableTitle}]`),
                ].join('\n\n')}
            />,
        );
        await editor.switchPreview('visible');
        await expect(headerTitle.previews).toHaveText([longTitle, unbreakableTitle]);
        const lines = await headerTitle.getLineCounts();
        expect(lines.every((count) => count > 1)).toBe(true);
        expect(await headerTitle.hasHorizontalScroll()).toBe(false);
    });
});

test.describe('Header title editing', () => {
    test('should render the title variants @wysiwyg', async ({
        mount,
        page,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(
            <div style={lowHeader}>
                <HeaderStories.Title width={760} />
            </div>,
        );
        await expect(headerTitle.blocks).toHaveCount(3);
        await expect(headerTitle.placeholders).toHaveText(['Banner title']);
        await header.hideToolbar();
        await page.mouse.move(0, 0);
        await expectScreenshot();
    });

    test('should render every size and color like the preview @wysiwyg @markup', async ({
        mount,
        editor,
        headerTitle,
    }) => {
        await mount(<HeaderStories.Title mode="markup" width={760} initial={stylesMarkup} />);
        await editor.switchPreview('visible');
        const count = headerTitleSizes.length + headerTitleColors.length;
        await expect(headerTitle.previews).toHaveCount(count);
        const previews = await headerTitle.getStyles();
        await editor.switchMode('wysiwyg');
        await expect(headerTitle.blocks).toHaveCount(count);
        expect(await headerTitle.getStyles(headerTitle.blocks)).toEqual(previews);
    });

    test('should wrap a long title without scrolling @wysiwyg', async ({mount, headerTitle}) => {
        await mount(
            <HeaderStories.Title
                width={760}
                initial={[
                    inHeader(`::header-title[${longTitle}]{size="1"}`),
                    inHeader(`::header-title[${unbreakableTitle}]`),
                ].join('\n\n')}
            />,
        );
        await expect(headerTitle.blocks).toHaveText([longTitle, unbreakableTitle]);
        const lines = await headerTitle.getLineCounts(headerTitle.blocks);
        expect(lines.every((count) => count > 1)).toBe(true);
        expect(await headerTitle.hasHorizontalScroll(headerTitle.blocks)).toBe(false);
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
            <HeaderStories.Title
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

    test('should keep one title on Enter and on block shortcuts @wysiwyg', async ({
        mount,
        editor,
        headerTitle,
    }) => {
        await mount(
            <HeaderStories.Title
                width={760}
                initial={inHeader('::header-title[Team portal]', 'Portal description.')}
            />,
        );
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
        await mount(<HeaderStories.Title width={760} initial={inHeader(title, 'Text')} />);
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
        expectScreenshot,
    }) => {
        await mount(
            <div style={lowHeader}>
                <HeaderStories.Title width={760} initial={inHeader('**First**', 'Second')} />
            </div>,
        );
        await header.blocks.getByText('Second').click();
        await header.openSettings();
        await expect(header.toggle('Title')).not.toBeChecked();
        await header.clickToggle('Title');
        await expect(headerTitle.blocks).toHaveText('This is your start page');
        await expect
            .poll(() => headerTitle.getMarkup())
            .toContain('\n\n::header-title[This is your start page]\n\n**First**\n\nSecond');
        await header.closeButton.click();
        await expect(header.settings).toBeHidden();
        // The banner toolbar is under the banner, outside the screenshot.
        await expectScreenshot({component: header.blocks});
    });
});
