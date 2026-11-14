import {
    type ButtonColor,
    type ButtonView,
    type HeaderContentSize,
    type HeaderTitleColor,
    type HeaderTitleSize,
    buttonColors,
    buttonViewColors,
    buttonViews,
    headerAligns,
    headerBgColors,
    headerBgImageThemes,
    headerContentSizes,
    headerHeights,
    headerTitleColors,
    headerTitleSizes,
    headerVerticals,
    headerWidths,
} from '@gravity-ui/markdown-plugin-header';

type ButtonStyle = readonly [view: ButtonView, color: ButtonColor];

/** Rows of the mock: a color in every view that has it. */
export const buttonStyleRows: readonly (readonly ButtonStyle[])[] = [
    [
        ['action', 'standard'],
        ['flat', 'standard'],
    ],
    [
        ['normal', 'gray'],
        ['outline', 'gray'],
        ['flat', 'gray'],
    ],
    ...buttonColors
        .filter((color) => color !== 'standard' && color !== 'gray')
        .map((color) =>
            buttonViews
                .filter((view) => buttonViewColors[view].includes(color))
                .map((view) => [view, color] as const),
        ),
];

export const buttonMarkup = ([view, color]: ButtonStyle, label = 'Button') =>
    `:button[${label}]{href="https://example.com" view="${view}" color="${color}"}`;

/** Buttons of a row go one after another in a paragraph, separated by spaces. */
export const buttonRowsMarkup = (rows = buttonStyleRows) =>
    rows.map((row) => row.map((style) => buttonMarkup(style)).join(' ')).join('\n\n');

/** The fill shows the bounds of the header around its content. */
export const inHeader = (content: string, attrs = '{bg-color="gray-light"}') =>
    `:::header${attrs}\n\n${content}\n\n:::`;

/** Inside a header every button stands in its own paragraph; the paragraphs form one row. */
export const buttonsInHeader = (styles: readonly ButtonStyle[]) =>
    inHeader(styles.map((style) => buttonMarkup(style)).join('\n\n'));

/** Every view and color in the text, then a header for each row of them. */
export const buttonStylesMarkup = [
    buttonRowsMarkup(),
    ...buttonStyleRows.map((row) => buttonsInHeader(row)),
].join('\n\n');

/** Neutral generated images of the demo assets for `bg-image`: a light, a dark and a high-contrast one. */
export const headerBgImages = {
    light: '/assets/header-bg-light.svg',
    dark: '/assets/header-bg-dark.svg',
    contrast: '/assets/header-bg-contrast.svg',
} as const;

/**
 * Neutral generated images of the demo assets for the image beside the text: their proportions
 * differ, and each one marks its center and its corners, so its crop is seen.
 */
export const headerImageSources = {
    landscape: '/assets/header-image-landscape.svg',
    wide: '/assets/header-image-wide.svg',
    tall: '/assets/header-image-tall.svg',
    square: '/assets/header-image-square.svg',
} as const;

/** The image with the attributes that are given: an empty text and no title are not written. */
export const headerImageMarkup = (
    src: string = headerImageSources.landscape,
    {alt, title}: {alt?: string; title?: string} = {},
) =>
    `::header-image{${[
        `src="${src}"`,
        alt === undefined ? '' : `alt="${alt}"`,
        title === undefined ? '' : `title="${title}"`,
    ]
        .filter(Boolean)
        .join(' ')}}`;

/** The buttons of the mock in the order a header adds them. */
const headerButtonStyles: readonly ButtonStyle[] = [
    ['action', 'blue'],
    ['normal', 'gray'],
    ['flat', 'standard'],
];

/** The title with the attributes that are given: the defaults are not written. */
export const headerTitleMarkup = (
    text = 'Team portal',
    {size, color}: {size?: HeaderTitleSize; color?: HeaderTitleColor} = {},
) => {
    const attrs = [size && `size="${size}"`, color && `color="${color}"`].filter(Boolean);
    return `::header-title[${text}]${attrs.length ? `{${attrs.join(' ')}}` : ''}`;
};

/** The description of the given paragraphs with the size that is given: no size is regular text. */
export const headerContentMarkup = (
    paragraphs: string | readonly string[] = 'Portal description.',
    {size}: {size?: HeaderContentSize} = {},
) => `:::header-content${size ? `{size="${size}"}` : ''}\n${[paragraphs].flat().join('\n\n')}\n:::`;

/** The content of the mock: the markup of a title, a description and buttons, each in its own block. */
export const headerMockMarkup = (
    buttons = 1,
    title = headerTitleMarkup(),
    description = headerContentMarkup(),
) =>
    [
        title,
        description,
        ...headerButtonStyles
            .slice(0, buttons)
            .map((style, index) => buttonMarkup(style, `Button ${index + 1}`)),
    ].join('\n\n');

/** A header with the attributes and the content of the mock, under a line that names it. */
export const headerExample = (attrs: string, content = headerMockMarkup()) =>
    `${attrs || 'no attributes'}\n\n${inHeader(content, attrs && `{${attrs}}`)}`;

/** Every value of every attribute of the header, then the attributes together. */
export const headerPreviewMarkup = [
    ...headerHeights.map((height) => headerExample(`height="${height}" bg-color="gray-light"`)),
    ...headerWidths.map((width) => headerExample(`width="${width}" bg-color="gray-light"`)),
    ...headerVerticals.flatMap((vertical) =>
        headerAligns.map((align) =>
            headerExample(
                `width="s" align="${align}" vertical="${vertical}" bg-color="gray-light"`,
                headerMockMarkup(3),
            ),
        ),
    ),
    ...headerBgColors.map((color) => headerExample(`bg-color="${color}"`)),
    ...headerBgImageThemes.flatMap((theme) => [
        headerExample(`bg-image="${headerBgImages.light}" bg-image-theme="${theme}"`),
        headerExample(`bg-image="${headerBgImages.dark}" bg-image-theme="${theme}"`),
    ]),
    headerExample(`bg-image="${headerBgImages.contrast}" bg-image-theme="dark"`),
    headerExample(
        `bg-image="${headerBgImages.contrast}" bg-image-theme="dark" bg-image-blur="true"`,
    ),
    headerExample(
        `height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="${headerBgImages.dark}" bg-image-theme="dark" bg-image-blur="true"`,
        headerMockMarkup(3),
    ),
].join('\n\n');

/** Every size, then every color, one title after another. */
export const headerTitlesMarkup = [
    ...headerTitleSizes.map((size) => headerTitleMarkup(`Title of size ${size}`, {size})),
    ...headerTitleColors.map((color) => headerTitleMarkup(`Title of the ${color} color`, {color})),
].join('\n\n');

/**
 * Every color of the title, each in a header with the given attributes.
 * The text of a title names its color and the background of its header.
 */
export const headerTitleColorsMarkup = (attrs: string, background: string) =>
    headerTitleColors
        .map((color) =>
            inHeader(
                headerTitleMarkup(`Title of the ${color} color on ${background}`, {color}),
                attrs && `{${attrs}}`,
            ),
        )
        .join('\n\n');

/** The titles in the text, then inside headers: every size with the content of the mock, every color. */
export const headerTitlePreviewMarkup = [
    headerTitlesMarkup,
    ...headerTitleSizes.map((size) =>
        headerExample(
            'bg-color="gray-light"',
            headerMockMarkup(1, headerTitleMarkup(`Title of size ${size}`, {size})),
        ),
    ),
    headerTitleColorsMarkup('', 'no fill'),
    headerTitleColorsMarkup('bg-color="gray-light"', 'gray-light'),
    headerTitleColorsMarkup('bg-color="blue-heavy"', 'blue-heavy'),
    headerTitleColorsMarkup(
        `bg-image="${headerBgImages.dark}" bg-image-theme="dark"`,
        'a dark image',
    ),
].join('\n\n');

/** A paragraph with every mark of the description and a link. */
export const headerContentMarks =
    'Text with **bold**, *italic*, ++underlined++, ~~strikethrough~~ and `monospace` text and a [link](/page).';

/** The image, its theme and its blur, with the name of the background. */
export const headerBgImageBackgrounds = [
    [`bg-image="${headerBgImages.light}"`, 'a light image'],
    [`bg-image="${headerBgImages.light}" bg-image-theme="light"`, 'a light image, light theme'],
    [`bg-image="${headerBgImages.dark}"`, 'a dark image'],
    [`bg-image="${headerBgImages.dark}" bg-image-theme="dark"`, 'a dark image, dark theme'],
    [
        `bg-image="${headerBgImages.contrast}" bg-image-theme="dark" bg-image-blur="true"`,
        'a blurred image, dark theme',
    ],
    [
        `bg-color="yellow-light" bg-image="${headerBgImages.contrast}" bg-image-theme="light" bg-image-blur="true"`,
        'a blurred image, light theme',
    ],
] as const;

/** No size, then every size, one description after another: a paragraph that names the size and a paragraph of marks. */
export const headerContentsMarkup = [undefined, ...headerContentSizes]
    .map((size) =>
        headerContentMarkup(
            [
                size ? `Description of size ${size}.` : 'Description without a size.',
                headerContentMarks,
            ],
            {size},
        ),
    )
    .join('\n\n');

/**
 * A description of marks and links in a header with the given attributes.
 * Its first paragraph names the background of the header.
 */
export const headerContentMarksMarkup = (attrs: string, background: string) =>
    inHeader(
        headerContentMarkup([`Description on ${background}.`, headerContentMarks]),
        attrs && `{${attrs}}`,
    );

/** The descriptions in the text, then inside headers: every size with the content of the mock, the marks on backgrounds. */
export const headerContentPreviewMarkup = [
    headerContentsMarkup,
    ...[undefined, ...headerContentSizes].map((size) =>
        headerExample(
            'bg-color="gray-light"',
            headerMockMarkup(
                1,
                headerTitleMarkup(),
                headerContentMarkup(
                    size ? `Description of size ${size}.` : 'Description without a size.',
                    {size},
                ),
            ),
        ),
    ),
    headerContentMarksMarkup('', 'no fill'),
    headerContentMarksMarkup('bg-color="blue-light"', 'blue-light'),
    headerContentMarksMarkup('bg-color="blue-medium"', 'blue-medium'),
    headerContentMarksMarkup('bg-color="blue-heavy"', 'blue-heavy'),
    headerContentMarksMarkup(
        `bg-image="${headerBgImages.dark}" bg-image-theme="dark"`,
        'a dark image',
    ),
].join('\n\n');

/** The image, then the content of the mock: a header shows the image beside its text. */
export const headerWithImageMarkup = (
    attrs: string,
    content = headerMockMarkup(),
    image = headerImageMarkup(headerImageSources.landscape, {alt: 'Team'}),
) => headerExample(attrs, `${image}\n\n${content}`);

/** The left and the right alignment: an image stands on the other side of the text. */
export const headerImageAligns = headerAligns.filter((align) => align !== 'center');

/**
 * The image in the text, then beside the text of a header: every height with the left and
 * the right alignment, the proportions of the image, the fills and the background images.
 */
export const headerImagePreviewMarkup = [
    headerImageMarkup(headerImageSources.landscape, {alt: 'Team', title: 'Project team'}),
    ...headerHeights.flatMap((height) =>
        headerImageAligns.map((align) =>
            headerWithImageMarkup(`height="${height}" align="${align}" bg-color="gray-light"`),
        ),
    ),
    ...Object.values(headerImageSources).map((src) =>
        headerWithImageMarkup(
            'bg-color="gray-light"',
            headerMockMarkup(2),
            headerImageMarkup(src, {alt: 'Team'}),
        ),
    ),
    headerWithImageMarkup('', headerMockMarkup(3)),
    headerWithImageMarkup('width="s" bg-color="blue-medium"'),
    headerWithImageMarkup('width="full" align="right" bg-color="violet-heavy"'),
    headerWithImageMarkup(`bg-image="${headerBgImages.dark}" bg-image-theme="dark"`),
    headerWithImageMarkup(
        `align="right" bg-image="${headerBgImages.contrast}" bg-image-theme="dark" bg-image-blur="true"`,
    ),
].join('\n\n');
