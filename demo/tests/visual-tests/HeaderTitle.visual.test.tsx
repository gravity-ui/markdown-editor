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
