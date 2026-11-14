import {headerBgColors, headerHeights, headerWidths} from '@gravity-ui/markdown-plugin-header';

import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/header-image';

import {markupExamplesDocument} from '../../src/stories/header/examples';
import {
    headerBgImageBackgrounds,
    headerBgImages,
    headerContentMarkup,
    headerImageAligns,
    headerImageMarkup,
    headerImageSources,
    headerMockMarkup,
    headerTitleMarkup,
    headerWithImageMarkup,
    inHeader,
} from '../../src/stories/header/markup';

import {HeaderStories} from './Header.helpers';
import {HeaderImageStories} from './HeaderImage.helpers';
import {HEIGHTS, MOBILE_WIDTH, NARROW_PADDING, PADDING, WIDTHS} from './utils/header-geometry';
import {markupExamples} from './utils/markup-examples';

// The space of the preview around its column.
const PREVIEW_CHROME = 160;
// Around the image, and from the image above the text to the text.
const IMAGE_PADDING = 8;
const NARROW_IMAGE_GAP = 24;
/** How an image fills its box, and its corners. */
const imageStyles = (radius: string) => ({
    objectFit: 'cover',
    borderTopLeftRadius: radius,
    borderBottomRightRadius: radius,
});
// The corners of an image in a header: the radius of the header (16px) less the space around it.
const IMAGE_STYLES = imageStyles('8px');
// The corners of an image outside a header: `--g-border-radius-xl`.
const TEXT_IMAGE_STYLES = imageStyles('10px');

/** The box of an image beside the text: a half of the header without the space around it. */
const imageSize = (width: number, height: number) => [
    width / 2 - 2 * IMAGE_PADDING,
    height - 2 * IMAGE_PADDING,
];
/** The distances from the left, right, top and bottom edges of a header to its image. */
const imageInsets = (width: number, align: string) => {
    const far = width / 2 + IMAGE_PADDING;
    return align === 'right'
        ? [IMAGE_PADDING, far, IMAGE_PADDING, IMAGE_PADDING]
        : [far, IMAGE_PADDING, IMAGE_PADDING, IMAGE_PADDING];
};
/** The distances from the left and right edges of a header to the text beside its image. */
const textInsets = (width: number, align: string) =>
    align === 'right' ? [width / 2 + PADDING, PADDING] : [PADDING, width / 2 + PADDING];

const image = headerImageMarkup(headerImageSources.landscape, {alt: 'Team'});
const brokenImage = '/assets/missing-image.jpg';
// Built at runtime for the `no-script-url` lint rule.
const scriptUrl = ['javascript', 'alert(1)'].join(':');

// Every height with the left and the right alignment.
const heightsMarkup = headerHeights.flatMap((height) =>
    headerImageAligns.map((align) =>
        headerWithImageMarkup(`height="${height}" align="${align}" bg-color="gray-light"`),
    ),
);

// Every width with the left and the right alignment.
const widthsMarkup = headerWidths.flatMap((width) =>
    headerImageAligns.map((align) =>
        headerWithImageMarkup(`width="${width}" align="${align}" bg-color="gray-light"`),
    ),
);

const longTitle =
    'A long title that does not fit into one line beside the image and wraps onto the next lines of the block';
const longText =
    'A long description of the page: what it is about, who it is for and what to do next. It does not fit into the height of the header, and the header grows with it. '.repeat(
        4,
    );

// The image beside every block of the content, and the content in the height of the block.
const contentMarkup = [
    headerWithImageMarkup('bg-color="gray-light"', ''),
    headerWithImageMarkup('bg-color="gray-light"', headerTitleMarkup()),
    headerWithImageMarkup('bg-color="gray-light"', headerContentMarkup()),
    headerWithImageMarkup(
        'bg-color="gray-light"',
        headerMockMarkup(3).split('\n\n').slice(2).join('\n\n'),
    ),
    headerWithImageMarkup('vertical="top" bg-color="gray-light"', headerMockMarkup(3)),
    headerWithImageMarkup(
        'align="right" vertical="bottom" bg-color="gray-light"',
        headerMockMarkup(3),
    ),
    headerWithImageMarkup(
        'bg-color="gray-light"',
        headerMockMarkup(
            2,
            headerTitleMarkup('Title of size 1', {size: 1, color: 'blue'}),
            headerContentMarkup(['Description of size 2.', 'Second paragraph.'], {size: 2}),
        ),
    ),
    // The image written after the text stands beside it as well.
    headerWithImageMarkup('bg-color="gray-light"', `${headerMockMarkup(1)}\n\n${image}`, ''),
];

const fillsMarkup = [
    headerWithImageMarkup(''),
    ...headerBgColors.map((color) => headerWithImageMarkup(`bg-color="${color}"`)),
];

const backgroundsMarkup = [
    ...headerBgImageBackgrounds.map(([attrs]) => headerWithImageMarkup(attrs)),
    headerWithImageMarkup(
        `align="right" bg-image="${headerBgImages.dark}" bg-image-theme="dark"`,
        headerMockMarkup(3),
    ),
    headerWithImageMarkup(
        `height="l" align="right" bg-image="${headerBgImages.contrast}" bg-image-theme="dark" bg-image-blur="true"`,
        headerMockMarkup(3),
    ),
];

// Images of any proportions fill the same box; a broken address leaves the box in place.
const stressImages = [
    headerImageSources.landscape,
    headerImageSources.wide,
    headerImageSources.tall,
    headerImageSources.square,
];
const stressMarkup = [
    ...stressImages.map((src) =>
        headerWithImageMarkup(
            'bg-color="gray-light"',
            headerMockMarkup(1),
            headerImageMarkup(src, {alt: 'Team'}),
        ),
    ),
    headerWithImageMarkup(
        'height="l" align="right" bg-color="gray-light"',
        headerMockMarkup(1),
        headerImageMarkup(headerImageSources.wide),
    ),
    headerWithImageMarkup(
        'height="l" width="s" bg-color="gray-light"',
        headerMockMarkup(3, headerTitleMarkup(longTitle)),
        headerImageMarkup(headerImageSources.tall),
    ),
    headerWithImageMarkup(
        'bg-color="gray-light"',
        headerMockMarkup(2, headerTitleMarkup(longTitle), headerContentMarkup(longText)),
        headerImageMarkup(headerImageSources.wide),
    ),
    headerWithImageMarkup(
        'bg-color="gray-light"',
        headerMockMarkup(1),
        headerImageMarkup(brokenImage, {
            alt: 'The alternative text of an image that fails to load',
        }),
    ),
    headerWithImageMarkup(
        'align="right" bg-color="blue-medium"',
        headerMockMarkup(1),
        headerImageMarkup(brokenImage),
    ),
];
const STRESS_BROKEN_COUNT = 2;

test.describe('Header image preview', () => {
    test.use({viewport: {width: 1440, height: 900}});

    test('should render the image in the text in its own proportions @markup', async ({
        mount,
        editor,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderImageStories.Preview
                width={720}
                initial={[
                    headerImageMarkup(headerImageSources.landscape, {
                        alt: 'Team',
                        title: 'Project team',
                    }),
                    'Text between the images.',
                    headerImageMarkup(headerImageSources.wide, {alt: ''}),
                    headerImageMarkup(headerImageSources.square, {title: 'Project team'}),
                ].join('\n\n')}
            />,
        );
        await expect(headerImage.previews).toHaveCount(3);
        expect(await headerImage.getValues()).toEqual([
            {src: headerImageSources.landscape, alt: 'Team', title: 'Project team'},
            {src: headerImageSources.wide, alt: '', title: null},
            {src: headerImageSources.square, alt: '', title: 'Project team'},
        ]);
        await wait.images(headerImage.previews);
        expect(await headerImage.getLoaded()).toEqual([true, true, true]);
        // An image outside a header is not wider than the text and keeps its proportions.
        const sizes = await headerImage.getSizes();
        const natural = await headerImage.getNaturalSizes();
        // To a tenth: the box of an image is measured in whole pixels.
        const proportions = (items: number[][]) =>
            items.map(([width, height]) => Math.round((10 * width) / height));
        expect(proportions(sizes)).toEqual(proportions(natural));
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        expect(await headerImage.getStyles()).toEqual(Array(3).fill(TEXT_IMAGE_STYLES));
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render every address, alternative text and title of the examples @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        // image-001 … image-012: the kinds of the address, each without and with the alternative
        // text and the title; image-013 … image-015: the empty text and the empty title.
        await mount(
            <HeaderImageStories.Preview
                width={WIDTHS.m + PREVIEW_CHROME}
                initial={markupExamplesDocument(markupExamples('image'), {
                    image: headerImageSources.landscape,
                })}
            />,
        );
        await expect(header.previews).toHaveCount(15);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(15);
        const src = headerImageSources.landscape;
        expect(await headerImage.getValues()).toEqual([
            ...Array(3)
                .fill([
                    {src, alt: '', title: null},
                    {src, alt: '', title: 'Project team'},
                    {src, alt: 'Team', title: null},
                    {src, alt: 'Team', title: 'Project team'},
                ])
                .flat(),
            // An empty title renders no attribute.
            ...Array(3).fill({src, alt: '', title: null}),
        ]);
        await expect(headerImage.previewsWith('title')).toHaveCount(6);
        await wait.images(headerImage.previews);
        expect(await headerImage.getLoaded()).toEqual(Array(15).fill(true));
        expect(await header.getPreviewSizes()).toEqual(Array(15).fill([WIDTHS.m, HEIGHTS.s]));
        expect(await headerImage.getSizes()).toEqual(
            Array(15).fill(imageSize(WIDTHS.m, HEIGHTS.s)),
        );
        expect(await headerImage.getInsets()).toEqual(
            Array(15).fill(imageInsets(WIDTHS.m, 'left')),
        );
        await expectScreenshot({component: editor.locators.component});
    });

    test('should place the image beside the text in every height with the left and the right alignment @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderImageStories.Preview
                width={WIDTHS.m + PREVIEW_CHROME}
                initial={heightsMarkup.join('\n\n')}
            />,
        );
        const cases = headerHeights.flatMap((height) =>
            headerImageAligns.map((align) => ({height: HEIGHTS[height], align})),
        );
        await expect(header.previews).toHaveCount(cases.length);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(cases.length);
        await wait.images(headerImage.previews);
        expect(await header.getPreviewSizes()).toEqual(cases.map(({height}) => [WIDTHS.m, height]));
        // The image fills the height of the block: on the right of the text, and on the left
        // of a right-aligned text.
        expect(await headerImage.getSizes()).toEqual(
            cases.map(({height}) => imageSize(WIDTHS.m, height)),
        );
        expect(await headerImage.getInsets()).toEqual(
            cases.map(({align}) => imageInsets(WIDTHS.m, align)),
        );
        expect((await headerImage.getTextInsets()).map((insets) => insets?.slice(0, 2))).toEqual(
            cases.map(({align}) => textInsets(WIDTHS.m, align)),
        );
        expect(await headerImage.getStyles()).toEqual(Array(cases.length).fill(IMAGE_STYLES));
        await expectScreenshot({component: editor.locators.component});
    });

    test('should give the image a half of every width @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderImageStories.Preview
                width={WIDTHS.l + PREVIEW_CHROME}
                initial={widthsMarkup.join('\n\n')}
            />,
        );
        const count = widthsMarkup.length;
        await expect(header.previews).toHaveCount(count);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(count);
        await wait.images(headerImage.previews);
        const sizes = await header.getPreviewSizes();
        // The widths `s`, `m` and `l`, then the width of the column.
        expect(sizes.slice(0, 6).map(([width]) => width)).toEqual(
            [WIDTHS.s, WIDTHS.m, WIDTHS.l].flatMap((width) => [width, width]),
        );
        expect(await header.getPreviewWidthGaps()).toContain(0);
        expect(sizes.map(([, height]) => height)).toEqual(Array(count).fill(HEIGHTS.s));
        expect(await headerImage.getSizes()).toEqual(
            sizes.map(([width, height]) => imageSize(width, height).map(Math.round)),
        );
        expect(await headerImage.getInsets()).toEqual(
            sizes.map(([width], index) =>
                imageInsets(width, headerImageAligns[index % 2]).map(Math.round),
            ),
        );
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should keep the image beside the title, the description and the buttons @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderImageStories.Preview
                width={WIDTHS.m + PREVIEW_CHROME}
                initial={contentMarkup.join('\n\n')}
            />,
        );
        const count = contentMarkup.length;
        await expect(header.previews).toHaveCount(count);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(count);
        await wait.images(headerImage.previews);
        // The content never changes the box of the image: it follows the size of the header.
        const sizes = await header.getPreviewSizes();
        expect(sizes.map(([width]) => width)).toEqual(Array(count).fill(WIDTHS.m));
        expect(Math.min(...sizes.map(([, height]) => height))).toBe(HEIGHTS.s);
        expect(await headerImage.getSizes()).toEqual(
            sizes.map(([width, height]) => imageSize(width, height)),
        );
        expect(await headerImage.getInsets()).toEqual(
            sizes.map(([width], index) => imageInsets(width, index === 5 ? 'right' : 'left')),
        );
        // The first header has an image only; in the others the text keeps its half.
        expect(
            (await headerImage.getTextInsets()).slice(1).map((insets) => insets?.slice(0, 2)),
        ).toEqual(
            sizes
                .slice(1)
                .map(([width], index) => textInsets(width, index === 4 ? 'right' : 'left')),
        );
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the image on every fill @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderImageStories.Preview
                width={WIDTHS.m + PREVIEW_CHROME}
                initial={fillsMarkup.join('\n\n')}
            />,
        );
        const count = fillsMarkup.length;
        await expect(header.previews).toHaveCount(count);
        await expect(header.previewsWith('data-bg-color')).toHaveCount(headerBgColors.length);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(count);
        await wait.images(headerImage.previews);
        expect(await headerImage.getLoaded()).toEqual(Array(count).fill(true));
        expect(await headerImage.getSizes()).toEqual(
            Array(count).fill(imageSize(WIDTHS.m, HEIGHTS.s)),
        );
        expect(await headerImage.getInsets()).toEqual(
            Array(count).fill(imageInsets(WIDTHS.m, 'left')),
        );
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the image on a background image with every theme and blur @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderImageStories.Preview
                width={WIDTHS.m + PREVIEW_CHROME}
                initial={backgroundsMarkup.join('\n\n')}
            />,
        );
        const count = backgroundsMarkup.length;
        await expect(header.previews).toHaveCount(count);
        await expect(header.previewsWith('data-bg-image')).toHaveCount(count);
        await expect(header.previewsWith('data-bg-image-blur')).toHaveCount(3);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(count);
        await wait.images(headerImage.previews);
        const sizes = await header.getPreviewSizes();
        // The blurred background is clipped at the edges of the header, the image is not.
        expect(await headerImage.getSizes()).toEqual(
            sizes.map(([width, height]) => imageSize(width, height)),
        );
        expect(await headerImage.getInsets()).toEqual(
            sizes.map(([width], index) =>
                imageInsets(width, index >= headerBgImageBackgrounds.length ? 'right' : 'left'),
            ),
        );
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        for (const src of Object.values(headerBgImages)) await header.waitForImage(src);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should crop images of any proportions and keep the box of a broken image @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderImageStories.Preview
                width={WIDTHS.m + PREVIEW_CHROME}
                initial={stressMarkup.join('\n\n')}
            />,
        );
        const count = stressMarkup.length;
        await expect(header.previews).toHaveCount(count);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(count);
        // A broken address fires `error`, not `load`: wait for the failure before the check.
        await wait.images(headerImage.previews);
        expect(await headerImage.getLoaded()).toEqual([
            ...Array(count - STRESS_BROKEN_COUNT).fill(true),
            ...Array(STRESS_BROKEN_COUNT).fill(false),
        ]);
        // The proportions of the file and a failed load change neither the box of the image
        // nor the size of the header.
        const sizes = await header.getPreviewSizes();
        expect(sizes.slice(0, 4)).toEqual(Array(4).fill([WIDTHS.m, HEIGHTS.s]));
        expect(sizes[4]).toEqual([WIDTHS.m, HEIGHTS.l]);
        expect(sizes[5][0]).toBe(WIDTHS.s);
        expect(sizes[6][1]).toBeGreaterThan(HEIGHTS.l);
        expect(sizes.slice(-STRESS_BROKEN_COUNT)).toEqual(
            Array(STRESS_BROKEN_COUNT).fill([WIDTHS.m, HEIGHTS.s]),
        );
        expect(await headerImage.getSizes()).toEqual(
            sizes.map(([width, height]) => imageSize(width, height)),
        );
        expect(await headerImage.getInsets()).toEqual(
            sizes.map(([width], index) =>
                imageInsets(width, index === 4 || index === count - 1 ? 'right' : 'left'),
            ),
        );
        expect(await headerImage.getStyles()).toEqual(Array(count).fill(IMAGE_STYLES));
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        await expectScreenshot({component: editor.locators.component});
    });

    test('should render the defaults and the unsupported input as written @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        // An image outside a header, a second image and an image in a centered header are
        // rendered as written; an image without a safe address renders nothing.
        await mount(
            <HeaderImageStories.Preview
                width={WIDTHS.m + PREVIEW_CHROME}
                initial={[
                    markupExamplesDocument(markupExamples('boundaries', 4, 4), {
                        image: headerImageSources.wide,
                    }),
                    'a second image',
                    inHeader(
                        [
                            headerImageMarkup(headerImageSources.landscape),
                            headerImageMarkup(headerImageSources.square),
                            headerMockMarkup(1),
                        ].join('\n\n'),
                    ),
                    'an image in a centered header',
                    inHeader(
                        `${image}\n\n${headerMockMarkup(1)}`,
                        '{align="center" bg-color="gray-light"}',
                    ),
                    'an unsafe address',
                    inHeader(`${headerImageMarkup(scriptUrl)}\n\n${headerMockMarkup(1)}`),
                    'no address',
                    inHeader(`::header-image{alt="Team"}\n\n${headerMockMarkup(1)}`),
                ].join('\n\n')}
            />,
        );
        await expect(header.previews).toHaveCount(4);
        await expect(headerImage.previews).toHaveCount(4);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(3);
        expect((await headerImage.getValues()).map(({src}) => src)).toEqual([
            headerImageSources.wide,
            headerImageSources.landscape,
            headerImageSources.square,
            headerImageSources.landscape,
        ]);
        // Without an image the text takes the whole width of its header.
        await expect(headerImage.inHeaders(header.previews.nth(2))).toHaveCount(0);
        await expect(headerImage.inHeaders(header.previews.nth(3))).toHaveCount(0);
        const insets = await header.getPreviewContentInsets();
        expect(insets.slice(2).map((inset) => inset?.slice(0, 2))).toEqual(
            Array(2).fill([PADDING, PADDING]),
        );
        await wait.images(headerImage.previews);
        expect(await headerImage.getLoaded()).toEqual(Array(4).fill(true));
        expect(await header.getPreviewSizes()).toEqual(Array(4).fill([WIDTHS.m, HEIGHTS.s]));
        await expectScreenshot({component: editor.locators.component});
    });

    test('should move the image above the text below the width of a small header @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        // A header of 599 px is narrow; a header of 600 px keeps the image beside the text.
        await mount(
            <HeaderImageStories.Preview
                width={760}
                initial={[
                    headerWithImageMarkup('width="s" bg-color="gray-light"'),
                    headerWithImageMarkup('width="m" bg-color="gray-light"'),
                ].join('\n\n')}
            />,
            {
                styles: ':root {--g-md-header-plugin-width-s: 599px; --g-md-header-plugin-width-m: 600px;}',
            },
        );
        await expect(header.previews).toHaveCount(2);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(2);
        await wait.images(headerImage.previews);
        const sizes = await header.getPreviewSizes();
        expect(sizes.map(([width]) => width)).toEqual([599, 600]);
        const [narrow, wide] = await headerImage.getInsets();
        expect(narrow?.slice(0, 3)).toEqual(Array(3).fill(IMAGE_PADDING));
        expect(wide).toEqual(imageInsets(600, 'left'));
        expect(await headerImage.getTextInsets()).toEqual([
            [NARROW_PADDING, NARROW_PADDING, NARROW_IMAGE_GAP],
            [...textInsets(600, 'left'), expect.any(Number)],
        ]);
        await expectScreenshot({component: editor.locators.component});
    });
});

test.describe('Header image', () => {
    test('should keep the images when switching modes @wysiwyg @markup', async ({
        mount,
        page,
        editor,
        header,
        headerImage,
        wait,
    }) => {
        const images = [
            headerImageMarkup(headerImageSources.landscape, {alt: 'Team', title: 'Project team'}),
            headerImageMarkup(headerImageSources.square),
        ];
        const values = [
            {src: headerImageSources.landscape, alt: 'Team', title: 'Project team'},
            {src: headerImageSources.square, alt: '', title: null},
        ];
        await mount(
            <HeaderStories.Header
                mode="markup"
                width={WIDTHS.m + PREVIEW_CHROME}
                initial={`${inHeader(`${images[0]}\n\n${headerMockMarkup(1)}`)}\n\n${images[1]}`}
            />,
        );
        await editor.switchMode('wysiwyg');
        await expect(headerImage.blocks).toHaveCount(2);
        expect(await headerImage.getValues(headerImage.blocks)).toEqual(values);
        // The editor shows the image beside the text, as the preview does.
        await expect(headerImage.inHeaders(header.blocks)).toHaveCount(1);
        await wait.images(headerImage.blocks);
        const [inset] = await headerImage.getInsets(headerImage.blocks);
        expect(inset?.[0]).toBeGreaterThan(inset?.[1] ?? Infinity);
        await editor.switchMode('markup');
        // A document that was not edited keeps its markup as written.
        const markup = await page.evaluate(() => window.mdEditor?.getValue());
        for (const item of images) expect(markup).toContain(item);
        await editor.switchPreview('visible');
        await expect(headerImage.previews).toHaveCount(2);
        expect(await headerImage.getValues()).toEqual(values);
        await editor.switchMode('wysiwyg');
        await expect(headerImage.blocks).toHaveCount(2);
        expect(await headerImage.getValues(headerImage.blocks)).toEqual(values);
    });
});

// The image above the text: as wide as the header without the space around it, 16:10.
const MOBILE_IMAGE_SIZE = [327, 204];

const mobileMarkup = [
    headerWithImageMarkup(''),
    headerWithImageMarkup('align="right" bg-color="gray-light"', headerMockMarkup(3)),
    headerWithImageMarkup(
        'height="l" bg-color="blue-medium"',
        headerMockMarkup(1),
        headerImageMarkup(headerImageSources.wide),
    ),
    headerWithImageMarkup(
        'bg-color="green-light"',
        headerMockMarkup(1),
        headerImageMarkup(headerImageSources.tall),
    ),
    headerWithImageMarkup(
        `bg-image="${headerBgImages.dark}" bg-image-theme="dark"`,
        headerMockMarkup(2),
        headerImageMarkup(headerImageSources.square),
    ),
    headerWithImageMarkup(
        'bg-color="gray-light"',
        headerMockMarkup(1, headerTitleMarkup(longTitle)),
        headerImageMarkup(brokenImage, {
            alt: 'The alternative text of an image that fails to load',
        }),
    ),
    // The image written after the text stands above it as well.
    headerWithImageMarkup('bg-color="violet-light"', `${headerMockMarkup(1)}\n\n${image}`, ''),
];

test.describe('Header image on mobile', () => {
    test.use({viewport: {width: MOBILE_WIDTH, height: 812}});

    test('should place the image above the text in a narrow header @markup', async ({
        mount,
        editor,
        header,
        headerImage,
        wait,
        expectScreenshot,
    }) => {
        await mount(
            <HeaderImageStories.Preview width="100%" initial={mobileMarkup.join('\n\n')} />,
            {
                rootStyle: {padding: 0, width: '100%'},
            },
        );
        const count = mobileMarkup.length;
        await expect(header.previews).toHaveCount(count);
        await expect(headerImage.inHeaders(header.previews)).toHaveCount(count);
        // The headers are as wide as the mobile covers of the mock.
        await editor.setPreviewContentWidth(MOBILE_WIDTH);
        expect((await header.getPreviewSizes()).map(([width]) => width)).toEqual(
            Array(count).fill(MOBILE_WIDTH),
        );
        await wait.images(headerImage.previews);
        expect(await headerImage.getLoaded()).toEqual([true, true, true, true, true, false, true]);
        // Every image has the same box above the text, whatever its file and the alignment are.
        expect(await headerImage.getSizes()).toEqual(Array(count).fill(MOBILE_IMAGE_SIZE));
        expect((await headerImage.getInsets()).map((insets) => insets?.slice(0, 3))).toEqual(
            Array(count).fill(Array(3).fill(IMAGE_PADDING)),
        );
        expect(await headerImage.getTextInsets()).toEqual(
            Array(count).fill([NARROW_PADDING, NARROW_PADDING, NARROW_IMAGE_GAP]),
        );
        expect(await editor.previewHasNoHorizontalScroll()).toBe(true);
        await header.waitForImage(headerBgImages.dark);
        await expectScreenshot({component: editor.locators.component});
    });
});
