import {
    headerBgColorFamilies,
    headerTitleColors,
    headerTitleSizes,
} from '@gravity-ui/markdown-plugin-header';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-title';

import {markupExamplesDocument} from '../../src/stories/header/examples';
import {
    buttonMarkup,
    headerContent,
    headerImageBackgrounds,
    headerImages,
    headerTitleColorsMarkup,
    headerTitleMarkup,
    headerTitlesMarkup,
    inHeader,
} from '../../src/stories/header/markup';

import {HeaderStories} from './Header.helpers';
import {HeaderTitleStories} from './HeaderTitle.helpers';
import {denseHeaderStyles, markupExamples} from './utils/markup-examples';

// The font size, the line height and the font weight of the sizes 1–6.
const TYPOGRAPHY = [
    ['32px', '40px', '600'],
    ['24px', '28px', '600'],
    ['20px', '24px', '600'],
    ['17px', '24px', '600'],
    ['15px', '20px', '600'],
    ['13px', '18px', '600'],
];
const DEFAULT_TYPOGRAPHY = TYPOGRAPHY[1];
const SIZE_COUNT = headerTitleSizes.length;
const COLOR_COUNT = headerTitleColors.length;
// The colors of the syntax examples: no color, then every color.
const EXAMPLE_COLOR_COUNT = COLOR_COUNT + 1;
const PADDING = 32;
// From the title to the description, and from the title to the buttons.
const TEXT_GAP = 16;
const BUTTONS_GAP = 32;

/** The titles of the syntax examples `first` … `last`: nine examples of every size. */
const titleExamples = (first: number, last: number) =>
    markupExamplesDocument(markupExamples('title', first, last));

/** Every color of the title on the six fills of a saturation. */
const fillsMarkup = (saturation: string) =>
    headerBgColorFamilies
        .map((family) =>
            headerTitleColorsMarkup(
                `bg-color="${family}-${saturation}"`,
                `${family}-${saturation}`,
            ),
        )
        .join('\n\n');

const longTitle =
    'A long title that does not fit into one line of the header and wraps onto the next lines of the block, and the header grows with it';
const unbreakable = 'Unbreakable'.repeat(14);
const stressMarkup = [
    inHeader(headerContent(2, headerTitleMarkup(longTitle, {size: 1}))),
    inHeader(
        headerContent(1, headerTitleMarkup(longTitle, {size: 6, color: 'blue'})),
        '{width="s" align="center" bg-color="blue-light"}',
    ),
    inHeader(
        headerContent(1, headerTitleMarkup(unbreakable, {size: 1, color: 'red'})),
        '{width="s" align="right" vertical="bottom" bg-color="red-light"}',
    ),
    inHeader(
        headerTitleMarkup(
            '**Bold** _italic_ ~~strike~~ `code` [link](/page) <b>tag</b> &copy; &amp; \\[brackets\\] "quotes"',
            {size: 3},
        ),
    ),
    inHeader(
        headerTitleMarkup('A', {color: 'green'}),
        '{height="l" align="right" vertical="bottom" bg-color="green-light"}',
    ),
    headerTitleMarkup(longTitle, {size: 1}),
    headerTitleMarkup(unbreakable, {size: 6, color: 'violet'}),
].join('\n\n');

test.describe('Header title preview', () => {
    test.use({viewport: {width: 1440, height: 900}});

    test('should render every size and color in the text @markup', async ({
        mount,
        editor,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderTitleStories.Preview width={720} initial={headerTitlesMarkup} />);
        await expect(headerTitle.previews).toHaveCount(SIZE_COUNT + COLOR_COUNT);
        const typography = await headerTitle.getTypography();
        expect(typography.slice(0, SIZE_COUNT)).toEqual(TYPOGRAPHY);
        expect(typography.slice(SIZE_COUNT)).toEqual(Array(COLOR_COUNT).fill(DEFAULT_TYPOGRAPHY));
        // `auto` is the color of the text around the title; every other color is its own.
        const colors = (await headerTitle.getColors()).slice(SIZE_COUNT);
        const [textColor] = await headerTitle.getParentColors();
        expect(colors[0]).toBe(textColor);
        expect(new Set(colors).size).toBe(COLOR_COUNT);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should lay out every size with the content of the mock in a header @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        // Every size with a description and a button, then a title right above the buttons.
        const markup = [
            ...headerTitleSizes.map(
                (size) =>
                    `size="${size}"\n\n${inHeader(headerContent(1, headerTitleMarkup('Team portal', {size})))}`,
            ),
            `no size, no description\n\n${inHeader(
                [
                    headerTitleMarkup(),
                    buttonMarkup(['action', 'blue'], 'Button 1'),
                    buttonMarkup(['normal', 'gray'], 'Button 2'),
                ].join('\n\n'),
            )}`,
        ].join('\n\n');
        await mount(<HeaderTitleStories.Preview width={1060} initial={markup} />);
        await expect(header.previews).toHaveCount(SIZE_COUNT + 1);
        await expect(headerTitle.previews).toHaveCount(SIZE_COUNT + 1);
        expect(await headerTitle.getTypography()).toEqual([...TYPOGRAPHY, DEFAULT_TYPOGRAPHY]);
        expect(await headerTitle.getGaps()).toEqual([TEXT_GAP, BUTTONS_GAP]);
        // The title is the first block of the content: it stands at the padding of the header.
        const insets = await header.getPreviewContentInsets();
        expect(insets.map((inset) => inset?.slice(0, 2))).toEqual(
            Array(SIZE_COUNT + 1).fill([PADDING, PADDING]),
        );
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render no size and the sizes 1 and 2 with every color @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        // title-001 … title-027: no size is the size 2.
        await mount(<HeaderTitleStories.Preview width={1060} initial={titleExamples(1, 27)} />, {
            styles: denseHeaderStyles,
        });
        await expect(header.previews).toHaveCount(27);
        await expect(headerTitle.previews).toHaveCount(27);
        await expect(headerTitle.previewsWith('aria-level', '1')).toHaveCount(EXAMPLE_COLOR_COUNT);
        await expect(headerTitle.previewsWith('aria-level', '2')).toHaveCount(
            2 * EXAMPLE_COLOR_COUNT,
        );
        // No color and `auto` render no attribute.
        await expect(headerTitle.previewsWith('data-color')).toHaveCount(3 * (COLOR_COUNT - 1));
        expect(await headerTitle.getTypography()).toEqual([
            ...Array(EXAMPLE_COLOR_COUNT).fill(DEFAULT_TYPOGRAPHY),
            ...Array(EXAMPLE_COLOR_COUNT).fill(TYPOGRAPHY[0]),
            ...Array(EXAMPLE_COLOR_COUNT).fill(DEFAULT_TYPOGRAPHY),
        ]);
        // A color is the same in every size.
        const colors = await headerTitle.getColors();
        expect(colors.slice(EXAMPLE_COLOR_COUNT, 2 * EXAMPLE_COLOR_COUNT)).toEqual(
            colors.slice(0, EXAMPLE_COLOR_COUNT),
        );
        expect(new Set(colors).size).toBe(COLOR_COUNT);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the sizes 3–6 with every color @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        // title-028 … title-063.
        await mount(<HeaderTitleStories.Preview width={1060} initial={titleExamples(28, 63)} />, {
            styles: denseHeaderStyles,
        });
        await expect(header.previews).toHaveCount(36);
        await expect(headerTitle.previews).toHaveCount(36);
        for (const size of headerTitleSizes.slice(2)) {
            await expect(headerTitle.previewsWith('aria-level', String(size))).toHaveCount(
                EXAMPLE_COLOR_COUNT,
            );
        }
        await expect(headerTitle.previewsWith('data-color')).toHaveCount(4 * (COLOR_COUNT - 1));
        expect(await headerTitle.getTypography()).toEqual(
            TYPOGRAPHY.slice(2).flatMap((typography) =>
                Array(EXAMPLE_COLOR_COUNT).fill(typography),
            ),
        );
        expect(new Set(await headerTitle.getColors()).size).toBe(COLOR_COUNT);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render every color on the light fills @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderTitleStories.Preview width={1060} initial={fillsMarkup('light')} />, {
            styles: denseHeaderStyles,
        });
        await expect(header.previews).toHaveCount(6 * COLOR_COUNT);
        await expect(headerTitle.previews).toHaveCount(6 * COLOR_COUNT);
        // The colors do not depend on the fill; `auto` is the text color of the header.
        expect(new Set(await headerTitle.getColors()).size).toBe(COLOR_COUNT);
        expect(await headerTitle.getColors(headerTitle.previews.first())).toEqual(
            await headerTitle.getParentColors(headerTitle.previews.first()),
        );
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render every color on the medium fills @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderTitleStories.Preview width={1060} initial={fillsMarkup('medium')} />, {
            styles: denseHeaderStyles,
        });
        await expect(header.previews).toHaveCount(6 * COLOR_COUNT);
        await expect(headerTitle.previews).toHaveCount(6 * COLOR_COUNT);
        expect(new Set(await headerTitle.getColors()).size).toBe(COLOR_COUNT);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render every color on the heavy fills @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderTitleStories.Preview width={1060} initial={fillsMarkup('heavy')} />, {
            styles: denseHeaderStyles,
        });
        await expect(header.previews).toHaveCount(6 * COLOR_COUNT);
        await expect(headerTitle.previews).toHaveCount(6 * COLOR_COUNT);
        expect(new Set(await headerTitle.getColors()).size).toBe(COLOR_COUNT);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render every color on an image with every theme @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderTitleStories.Preview
                width={1060}
                initial={headerImageBackgrounds
                    .map(([attrs, name]) => headerTitleColorsMarkup(attrs, name))
                    .join('\n\n')}
            />,
            {styles: denseHeaderStyles},
        );
        const count = headerImageBackgrounds.length * COLOR_COUNT;
        await expect(header.previews).toHaveCount(count);
        await expect(headerTitle.previews).toHaveCount(count);
        await expect(header.previewsWith('data-bg-image-theme', 'dark')).toHaveCount(
            2 * COLOR_COUNT,
        );
        await expect(header.previewsWith('data-bg-image-theme', 'light')).toHaveCount(
            2 * COLOR_COUNT,
        );
        // `auto` follows the theme of the image: it is the text color of its header.
        const colors = await headerTitle.getColors();
        const headerColors = await headerTitle.getParentColors();
        const autoIndexes = headerImageBackgrounds.map((_, index) => index * COLOR_COUNT);
        expect(autoIndexes.map((index) => colors[index])).toEqual(
            autoIndexes.map((index) => headerColors[index]),
        );
        // The light and the dark theme have their own text colors.
        expect(new Set(autoIndexes.map((index) => colors[index])).size).toBe(2);
        // So do the other colors: each one is a color of the theme of its header.
        expect(new Set(colors).size).toBe(2 * COLOR_COUNT);
        for (const image of Object.values(headerImages)) await header.waitForImage(image);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should wrap a long title and show the text as written @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderTitleStories.Preview width={1060} initial={stressMarkup} />);
        await expect(header.previews).toHaveCount(5);
        await expect(headerTitle.previews).toHaveCount(7);
        // The width is kept: long words wrap, and the header grows with its title.
        expect((await header.getPreviewSizes()).map(([width]) => width)).toEqual([
            900, 600, 600, 900, 900,
        ]);
        const lines = await headerTitle.getLineCounts();
        expect(lines[0]).toBeGreaterThan(1);
        expect(lines[1]).toBeGreaterThan(1);
        expect(lines[2]).toBeGreaterThan(1);
        expect(lines[4]).toBe(1);
        expect(lines[5]).toBeGreaterThan(1);
        // Markdown, HTML and entities in the text are not parsed.
        await expect(headerTitle.previews.nth(3)).toHaveText(
            '**Bold** _italic_ ~~strike~~ `code` [link](/page) <b>tag</b> &copy; &amp; [brackets] "quotes"',
        );
        await expect(headerTitle.previews.locator('*')).toHaveCount(0);
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the minimal and the empty title, a title outside a header and a second title as written @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        // The minimal title, the title in a header with explicit defaults, the empty title;
        // a title outside a header and a second title: dropping them is a separate task.
        const examples = [
            ...markupExamples('defaults', 2, 2),
            ...markupExamples('defaults', 7, 8),
            ...markupExamples('boundaries', 2, 2),
            ...markupExamples('boundaries', 6, 6),
        ];
        await mount(
            <HeaderTitleStories.Preview width={1060} initial={markupExamplesDocument(examples)} />,
        );
        await expect(header.previews).toHaveCount(4);
        expect(await headerTitle.getValues()).toEqual([
            {size: '2', color: 'auto', text: 'Team portal'},
            {size: '2', color: 'auto', text: 'Team portal'},
            {size: '2', color: 'auto', text: 'Heading'},
            {size: '2', color: 'auto', text: 'First'},
            {size: '2', color: 'auto', text: 'Second'},
        ]);
        expect(await headerTitle.getGaps(headerTitle.inHeaders(header.previews))).toEqual([
            TEXT_GAP,
        ]);
        await expectScreenshot({component: editor.locators.component});
    });
});

test.describe('Header title', () => {
    test('should keep the titles when switching modes @wysiwyg @markup', async ({
        mount,
        page,
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
                initial={`:::header{bg-color="gray-light"}\n\n${titles[0]}\n\nText\n\n:::\n\n${titles[1]}`}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expect(headerTitle.blocks).toHaveCount(2);
        expect(await headerTitle.getValues(headerTitle.blocks)).toEqual(values);
        expect(await headerTitle.getTypography(headerTitle.blocks)).toEqual([
            TYPOGRAPHY[0],
            DEFAULT_TYPOGRAPHY,
        ]);
        await editor.switchMode('markup');
        const markup = await page.evaluate(() => window.mdEditor?.getValue());
        for (const title of titles) expect(markup).toContain(title);
        await editor.switchPreview('visible');
        await expect(headerTitle.previews).toHaveCount(2);
        expect(await headerTitle.getValues()).toEqual(values);
        await editor.switchMode('wysiwyg');
        await expect(headerTitle.blocks).toHaveCount(2);
        expect(await headerTitle.getValues(headerTitle.blocks)).toEqual(values);
    });
});

// The width of the mobile covers of the mock.
const MOBILE_WIDTH = 343;
const MOBILE_PADDING = 16;

const mobileMarkup = [
    ...headerTitleSizes.map((size) =>
        inHeader(headerContent(1, headerTitleMarkup(`Title of size ${size}`, {size}))),
    ),
    inHeader(headerContent(2, headerTitleMarkup(longTitle, {size: 1}))),
    inHeader(
        headerContent(1, headerTitleMarkup(unbreakable, {color: 'violet'})),
        '{align="center" bg-color="violet-light"}',
    ),
    inHeader(
        headerContent(1, headerTitleMarkup('Title on a dark image', {color: 'yellow'})),
        `{align="right" bg-image="${headerImages.dark}" bg-image-theme="dark"}`,
    ),
].join('\n\n');

test.describe('Header title on mobile', () => {
    test.use({viewport: {width: MOBILE_WIDTH, height: 812}});

    test('should keep the sizes and wrap in a narrow header @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        expectScreenshot,
    }) => {
        await mount(<HeaderTitleStories.Preview width="100%" initial={mobileMarkup} />, {
            rootStyle: {padding: 0, width: '100%'},
        });
        const count = SIZE_COUNT + 3;
        await expect(header.previews).toHaveCount(count);
        await expect(headerTitle.previews).toHaveCount(count);
        // The headers are as wide as the mobile covers of the mock.
        await editor.setPreviewContentWidth(MOBILE_WIDTH);
        expect((await header.getPreviewSizes()).map(([width]) => width)).toEqual(
            Array(count).fill(MOBILE_WIDTH),
        );
        // The typography of a size is the same as in a wide header.
        expect((await headerTitle.getTypography()).slice(0, SIZE_COUNT)).toEqual(TYPOGRAPHY);
        const insets = await header.getPreviewContentInsets();
        expect(insets.map((inset) => inset?.slice(0, 2))).toEqual(
            Array(count).fill([MOBILE_PADDING, MOBILE_PADDING]),
        );
        expect(await headerTitle.getGaps()).toEqual([TEXT_GAP]);
        const lines = await headerTitle.getLineCounts();
        expect(lines[SIZE_COUNT]).toBeGreaterThan(1);
        expect(lines[SIZE_COUNT + 1]).toBeGreaterThan(1);
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        await header.waitForImage(headerImages.dark);
        await expectScreenshot({component: editor.locators.component});
    });
});
