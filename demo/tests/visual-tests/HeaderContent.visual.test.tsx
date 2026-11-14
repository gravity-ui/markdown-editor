import {headerBgColors, headerContentSizes} from '@gravity-ui/markdown-plugin-header';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-content';

import {markupExamplesDocument} from '../../src/stories/header/examples';
import {
    headerContent,
    headerContentMarks,
    headerContentMarksMarkup,
    headerContentMarkup,
    headerContentsMarkup,
    headerImageBackgrounds,
    headerImages,
    headerTitleMarkup,
    inHeader,
} from '../../src/stories/header/markup';

import {HeaderStories} from './Header.helpers';
import {HeaderContentStories} from './HeaderContent.helpers';
import {denseHeaderStyles, markupExamples} from './utils/markup-examples';

// The font size, the line height and the font weight of regular text and of the sizes 1–6.
const REGULAR_TYPOGRAPHY = ['15px', '20px', '400'];
const TYPOGRAPHY = [
    ['32px', '40px', '400'],
    ['24px', '28px', '400'],
    ['20px', '24px', '400'],
    ['17px', '24px', '400'],
    ['15px', '20px', '400'],
    ['13px', '18px', '400'],
];
const SIZE_COUNT = headerContentSizes.length;
// No size, then every size.
const EXAMPLE_SIZE_COUNT = SIZE_COUNT + 1;
const PADDING = 32;
// From the title to the description, from the description to the buttons,
// and between the paragraphs of a description.
const TEXT_GAP = 16;
const BUTTONS_GAP = 32;
const PARAGRAPH_GAP = 8;

/** No size, then every size, each with the content of the mock in a header. */
const sizesMarkup = [undefined, ...headerContentSizes].map((size) =>
    inHeader(
        headerContent(
            1,
            headerTitleMarkup(),
            headerContentMarkup(
                size ? `Description of size ${size}.` : 'Description without a size.',
                {size},
            ),
        ),
    ),
);

/** The examples of the marks and links `first` … `last`. */
const nestedExamples = (first: number, last: number) =>
    markupExamplesDocument(markupExamples('nested', first, last));

// Every fill gives the links the text color; the light fills keep the inline code of the page.
const lightFills = headerBgColors.filter((color) => color.endsWith('-light'));
const otherFills = headerBgColors.filter((color) => !color.endsWith('-light'));
const fillsMarkup = [
    headerContentMarksMarkup('', 'no fill'),
    ...[...lightFills, ...otherFills].map((color) =>
        headerContentMarksMarkup(`bg-color="${color}"`, color),
    ),
].join('\n\n');

const longText =
    'A long description of the page: what it is about, who it is for and what to do next. It does not fit into one line of the header and wraps onto the next lines of the block, and the header grows with it. '.repeat(
        3,
    );
const longAddress = `https://example.org/${'a-long-address-without-a-break/'.repeat(8)}page`;
const unbreakable = 'Unbreakable'.repeat(14);
const manyParagraphs = Array.from(
    {length: 12},
    (_, index) => `Paragraph ${index + 1} of a description taller than the header.`,
);
const stressMarkup = [
    inHeader(headerContent(2, headerTitleMarkup(), headerContentMarkup(longText))),
    inHeader(
        headerContent(1, headerTitleMarkup(), headerContentMarkup(longText, {size: 1})),
        '{width="s" align="center" bg-color="blue-light"}',
    ),
    inHeader(
        headerContent(
            1,
            headerTitleMarkup(),
            headerContentMarkup([`An address: [${longAddress}](${longAddress}).`, unbreakable], {
                size: 3,
            }),
        ),
        '{width="s" align="right" vertical="bottom" bg-color="red-medium"}',
    ),
    inHeader(
        headerContent(3, headerTitleMarkup(), headerContentMarkup(manyParagraphs)),
        `{width="s" bg-image="${headerImages.dark}" bg-image-theme="dark"}`,
    ),
    inHeader(
        headerContentMarkup('A', {size: 6}),
        '{height="l" align="right" vertical="bottom" bg-color="green-light"}',
    ),
    headerContentMarkup(longText, {size: 2}),
    headerContentMarkup(`[${longAddress}](${longAddress})`, {size: 6}),
].join('\n\n');

test.describe('Header content preview', () => {
    test.use({viewport: {width: 1440, height: 900}});

    test('should render regular text and every size in the text @markup', async ({
        mount,
        editor,
        headerContent: content,
        expectScreenshot,
    }) => {
        await mount(<HeaderContentStories.Preview width={720} initial={headerContentsMarkup} />);
        await expect(content.previews).toHaveCount(EXAMPLE_SIZE_COUNT);
        expect(await content.getTypography()).toEqual([REGULAR_TYPOGRAPHY, ...TYPOGRAPHY]);
        expect(await content.getParagraphGaps()).toEqual([PARAGRAPH_GAP]);
        // Outside a header the links are the links of the page.
        const links = await content.getLinkStyles();
        expect(links).toHaveLength(EXAMPLE_SIZE_COUNT);
        expect(
            links.every(({color, underline, textColor}) => color !== textColor && !underline),
        ).toBe(true);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should lay out every size with the content of the mock in a header @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        headerContent: content,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderContentStories.Preview width={1060} initial={sizesMarkup.join('\n\n')} />,
        );
        await expect(header.previews).toHaveCount(EXAMPLE_SIZE_COUNT);
        await expect(content.inHeaders(header.previews)).toHaveCount(EXAMPLE_SIZE_COUNT);
        expect(await content.getTypography()).toEqual([REGULAR_TYPOGRAPHY, ...TYPOGRAPHY]);
        // The description stands under the title and above the buttons.
        expect(await headerTitle.getGaps()).toEqual([TEXT_GAP]);
        expect(await content.getGaps()).toEqual([BUTTONS_GAP]);
        expect(await header.getPreviewButtonGaps()).toEqual([BUTTONS_GAP]);
        const insets = await header.getPreviewContentInsets();
        expect(insets.map((inset) => inset?.slice(0, 2))).toEqual(
            Array(EXAMPLE_SIZE_COUNT).fill([PADDING, PADDING]),
        );
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render no size and every size with one and two paragraphs @markup', async ({
        mount,
        editor,
        header,
        headerContent: content,
        expectScreenshot,
    }) => {
        // description-001 … description-014.
        await mount(
            <HeaderContentStories.Preview
                width={1060}
                initial={markupExamplesDocument(markupExamples('description'))}
            />,
            {styles: denseHeaderStyles},
        );
        await expect(header.previews).toHaveCount(2 * EXAMPLE_SIZE_COUNT);
        await expect(content.previews).toHaveCount(2 * EXAMPLE_SIZE_COUNT);
        // No size renders no attribute.
        await expect(content.previewsWith('data-size')).toHaveCount(2 * SIZE_COUNT);
        const values = await content.getValues();
        expect(values.map(({size}) => size)).toEqual(
            [null, ...headerContentSizes.map(String)].flatMap((size) => [size, size]),
        );
        expect(values.map(({paragraphs}) => paragraphs.length)).toEqual(
            Array(EXAMPLE_SIZE_COUNT).fill([1, 2]).flat(),
        );
        expect(await content.getTypography()).toEqual(
            [REGULAR_TYPOGRAPHY, ...TYPOGRAPHY].flatMap((typography) => [typography, typography]),
        );
        expect(await content.getParagraphGaps()).toEqual([PARAGRAPH_GAP]);
        await expect(content.links).toHaveCount(EXAMPLE_SIZE_COUNT);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the marks and the link without bold text @markup', async ({
        mount,
        editor,
        header,
        headerContent: content,
        expectScreenshot,
    }) => {
        // nested-001 … nested-032: every combination of italic, underlined, strikethrough
        // and monospace text and a link.
        await mount(<HeaderContentStories.Preview width={1060} initial={nestedExamples(1, 32)} />, {
            styles: denseHeaderStyles,
        });
        await expect(header.previews).toHaveCount(32);
        await expect(content.previews).toHaveCount(32);
        await expect(content.previews.locator('strong')).toHaveCount(0);
        for (const tag of ['em', 'ins', 's', 'code', 'a']) {
            await expect(content.previews.locator(tag)).toHaveCount(16);
        }
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the marks and the link with bold text @markup', async ({
        mount,
        editor,
        header,
        headerContent: content,
        expectScreenshot,
    }) => {
        // nested-033 … nested-064: the same combinations with bold text.
        await mount(
            <HeaderContentStories.Preview width={1060} initial={nestedExamples(33, 64)} />,
            {styles: denseHeaderStyles},
        );
        await expect(header.previews).toHaveCount(32);
        await expect(content.previews).toHaveCount(32);
        await expect(content.previews.locator('strong')).toHaveCount(32);
        for (const tag of ['em', 'ins', 's', 'code', 'a']) {
            await expect(content.previews.locator(tag)).toHaveCount(16);
        }
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render links, nested marks and several paragraphs @markup', async ({
        mount,
        editor,
        header,
        headerContent: content,
        expectScreenshot,
    }) => {
        // nested-065 … nested-078: the kinds of links, marks inside one another, two and three
        // paragraphs, and a description among the other blocks of a header.
        await mount(
            <HeaderContentStories.Preview width={1060} initial={nestedExamples(65, 78)} />,
            {styles: denseHeaderStyles},
        );
        await expect(header.previews).toHaveCount(14);
        await expect(content.previews).toHaveCount(14);
        const values = await content.getValues();
        expect(values.map(({paragraphs}) => paragraphs.length)).toEqual([
            1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 2,
        ]);
        expect(values[10].paragraphs).toEqual([
            'Important: read this first and visit the team page.',
        ]);
        await expect(content.links).toHaveCount(18);
        await expect(content.previews.locator('a strong, a em')).toHaveCount(2);
        await expect(content.previews.locator('strong a, em a, ins a, s a')).toHaveCount(5);
        expect(await content.getParagraphGaps()).toEqual([PARAGRAPH_GAP]);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep the links readable on every fill @markup', async ({
        mount,
        editor,
        header,
        headerContent: content,
        expectScreenshot,
    }) => {
        await mount(<HeaderContentStories.Preview width={1060} initial={fillsMarkup} />, {
            styles: denseHeaderStyles,
        });
        const count = 1 + headerBgColors.length;
        await expect(header.previews).toHaveCount(count);
        await expect(content.previews).toHaveCount(count);
        const links = await content.getLinkStyles();
        expect(links).toHaveLength(count);
        // Without a fill: the link color of the page, no underline.
        const [pageLink, ...fillLinks] = links;
        expect(pageLink.underline).toBe(false);
        expect(pageLink.color).not.toBe(pageLink.textColor);
        // On every fill: the color of the text and an underline.
        expect(fillLinks).toHaveLength(lightFills.length + otherFills.length);
        expect(
            fillLinks.every(({color, underline, textColor}) => underline && color === textColor),
        ).toBe(true);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep the links readable on an image with every theme @markup', async ({
        mount,
        editor,
        header,
        headerContent: content,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderContentStories.Preview
                width={1060}
                initial={headerImageBackgrounds
                    .map(([attrs, name]) => headerContentMarksMarkup(attrs, name))
                    .join('\n\n')}
            />,
            {styles: denseHeaderStyles},
        );
        const count = headerImageBackgrounds.length;
        await expect(header.previews).toHaveCount(count);
        await expect(content.previews).toHaveCount(count);
        // The links follow the theme of the image: they take the text color of their header.
        const links = await content.getLinkStyles();
        expect(links).toHaveLength(count);
        expect(
            links.every(({color, underline, textColor}) => underline && color === textColor),
        ).toBe(true);
        expect(links.map(({textColor}) => textColor)).toEqual(await header.getPreviewColors());
        // The light and the dark theme have their own text and inline code colors.
        expect(new Set(links.map(({color}) => color)).size).toBe(2);
        const codeColors = await content.getCodeColors();
        expect(codeColors).toHaveLength(count);
        expect(codeColors[1]).not.toBe(codeColors[3]);
        for (const image of Object.values(headerImages)) await header.waitForImage(image);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should wrap long paragraphs and addresses and grow with many paragraphs @markup', async ({
        mount,
        editor,
        header,
        headerContent: content,
        expectScreenshot,
    }) => {
        await mount(<HeaderContentStories.Preview width={1060} initial={stressMarkup} />);
        await expect(header.previews).toHaveCount(5);
        await expect(content.previews).toHaveCount(7);
        // The width is kept: long words and addresses wrap, and the header grows with its text.
        const sizes = await header.getPreviewSizes();
        expect(sizes.map(([width]) => width)).toEqual([900, 600, 600, 600, 900]);
        expect(sizes[3][1]).toBeGreaterThan(360);
        const lines = await content.getLineCounts();
        expect(lines.slice(0, 3).every((count) => count > 1)).toBe(true);
        expect(lines[4]).toBe(1);
        expect(lines[5]).toBeGreaterThan(1);
        expect(lines[6]).toBeGreaterThan(1);
        expect((await content.getValues())[3].paragraphs).toHaveLength(manyParagraphs.length);
        expect(await content.getParagraphGaps()).toEqual([PARAGRAPH_GAP]);
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        await header.waitForImage(headerImages.dark);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the minimal and the empty description, a description outside a header and a second description as written @markup', async ({
        mount,
        editor,
        header,
        headerContent: content,
        expectScreenshot,
    }) => {
        // The minimal description, the empty title and description; a description outside
        // a header and a second description: dropping them is a separate task.
        const examples = [
            ...markupExamples('defaults', 3, 3),
            ...markupExamples('defaults', 8, 8),
            ...markupExamples('boundaries', 3, 3),
        ];
        await mount(
            <HeaderContentStories.Preview
                width={1060}
                initial={[
                    markupExamplesDocument(examples),
                    'a second description',
                    inHeader(
                        [
                            headerContentMarkup('First description.'),
                            headerContentMarkup('Second description.', {size: 1}),
                        ].join('\n\n'),
                        '',
                    ),
                ].join('\n\n')}
            />,
        );
        await expect(header.previews).toHaveCount(3);
        expect(await content.getValues()).toEqual([
            {size: null, paragraphs: ['Portal description.']},
            {size: null, paragraphs: ['Description.']},
            {size: null, paragraphs: ['First description.']},
            {size: '1', paragraphs: ['Second description.']},
        ]);
        // An empty description renders no element: its header is empty.
        await expect(header.previews.nth(1).locator('*')).toHaveCount(0);
        expect(await content.getGaps(content.inHeaders(header.previews))).toEqual([TEXT_GAP]);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep the color of a link under the pointer on a fill @markup', async ({
        mount,
        page,
        headerContent: content,
    }) => {
        await mount(
            <HeaderContentStories.Preview
                width={1060}
                initial={[
                    headerContentMarksMarkup('', 'no fill'),
                    headerContentMarksMarkup('bg-color="blue-heavy"', 'blue-heavy'),
                ].join('\n\n')}
            />,
            {styles: denseHeaderStyles},
        );
        await expect(content.links).toHaveCount(2);
        const [pageLink, fillLink] = await content.getLinkStyles();
        // A link of the page takes its hover color.
        await content.links.first().hover();
        await expect
            .poll(async () => (await content.getLinkStyles())[0].color)
            .not.toBe(pageLink.color);
        // A link on a fill stays in the text color with its underline.
        await content.links.last().hover();
        await expect
            .poll(async () => (await content.getLinkStyles())[0].color)
            .toBe(pageLink.color);
        expect((await content.getLinkStyles())[1]).toEqual(fillLink);
        await page.mouse.move(0, 0);
    });
});

test.describe('Header content', () => {
    test('should keep the descriptions when switching modes @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        headerContent: content,
    }) => {
        const paragraphs = ['Portal **description** with a [link](/page).', 'Second paragraph.'];
        const values = [
            {size: '1', paragraphs: ['Portal description with a link.', 'Second paragraph.']},
            {size: null, paragraphs: ['Description outside a header.']},
        ];
        await mount(
            <HeaderStories.Header
                mode="markup"
                width={1000}
                initial={`${inHeader(
                    [headerTitleMarkup(), headerContentMarkup(paragraphs, {size: 1})].join('\n\n'),
                )}\n\n${headerContentMarkup('Description outside a header.')}`}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expect(content.blocks).toHaveCount(2);
        expect(await content.getValues(content.blocks)).toEqual(values);
        await editor.switchMode('markup');
        // A document that was not edited keeps its markup as written.
        const markup = await page.evaluate(() => window.mdEditor?.getValue());
        expect(markup).toContain(headerContentMarkup(paragraphs, {size: 1}));
        expect(markup).toContain(headerContentMarkup('Description outside a header.'));
        await editor.switchPreview('visible');
        await expect(content.previews).toHaveCount(2);
        expect(await content.getValues()).toEqual(values);
        await editor.switchMode('wysiwyg');
        await expect(content.blocks).toHaveCount(2);
        expect(await content.getValues(content.blocks)).toEqual(values);
    });
});

// The width of the mobile covers of the mock.
const MOBILE_WIDTH = 343;
const MOBILE_PADDING = 16;

const mobileMarkup = [
    ...sizesMarkup,
    inHeader(headerContent(2, headerTitleMarkup(), headerContentMarkup(longText))),
    inHeader(
        headerContent(
            1,
            headerTitleMarkup(),
            headerContentMarkup([`[${longAddress}](${longAddress})`, unbreakable]),
        ),
        '{align="center" bg-color="violet-light"}',
    ),
    inHeader(
        headerContent(
            1,
            headerTitleMarkup(),
            headerContentMarkup([headerContentMarks, ...manyParagraphs.slice(0, 4)]),
        ),
        `{align="right" bg-image="${headerImages.dark}" bg-image-theme="dark"}`,
    ),
].join('\n\n');

test.describe('Header content on mobile', () => {
    test.use({viewport: {width: MOBILE_WIDTH, height: 812}});

    test('should keep the sizes and wrap in a narrow header @markup', async ({
        mount,
        editor,
        header,
        headerTitle,
        headerContent: content,
        expectScreenshot,
    }) => {
        await mount(<HeaderContentStories.Preview width="100%" initial={mobileMarkup} />, {
            rootStyle: {padding: 0, width: '100%'},
        });
        const count = EXAMPLE_SIZE_COUNT + 3;
        await expect(header.previews).toHaveCount(count);
        await expect(content.previews).toHaveCount(count);
        // The headers are as wide as the mobile covers of the mock.
        await editor.setPreviewContentWidth(MOBILE_WIDTH);
        expect((await header.getPreviewSizes()).map(([width]) => width)).toEqual(
            Array(count).fill(MOBILE_WIDTH),
        );
        // The typography of a size is the same as in a wide header.
        expect((await content.getTypography()).slice(0, EXAMPLE_SIZE_COUNT)).toEqual([
            REGULAR_TYPOGRAPHY,
            ...TYPOGRAPHY,
        ]);
        const insets = await header.getPreviewContentInsets();
        expect(insets.map((inset) => inset?.slice(0, 2))).toEqual(
            Array(count).fill([MOBILE_PADDING, MOBILE_PADDING]),
        );
        expect(await headerTitle.getGaps()).toEqual([TEXT_GAP]);
        expect(await content.getGaps()).toEqual([BUTTONS_GAP]);
        expect(await content.getParagraphGaps()).toEqual([PARAGRAPH_GAP]);
        const lines = await content.getLineCounts();
        expect(lines[EXAMPLE_SIZE_COUNT]).toBeGreaterThan(1);
        expect(lines[EXAMPLE_SIZE_COUNT + 1]).toBeGreaterThan(1);
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        await header.waitForImage(headerImages.dark);
        await expectScreenshot({component: editor.locators.component});
    });
});
