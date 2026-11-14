import {
    type ButtonColor,
    type ButtonView,
    type HeaderTitleColor,
    type HeaderTitleSize,
    buttonColors,
    buttonViewColors,
    buttonViews,
    headerAligns,
    headerBgColors,
    headerBgImageThemes,
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

/** Neutral generated images of the demo assets: a light, a dark and a high-contrast one. */
export const headerImages = {
    light: '/assets/header-bg-light.svg',
    dark: '/assets/header-bg-dark.svg',
    contrast: '/assets/header-bg-contrast.svg',
} as const;

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

/**
 * The content of the mock: a title, a description and buttons, each in its own block.
 * The title is its text or its markup.
 */
export const headerContent = (buttons = 1, title = 'Team portal', text = 'Portal description.') =>
    [
        title.startsWith('::') ? title : headerTitleMarkup(title),
        `:::header-content\n${text}\n:::`,
        ...headerButtonStyles
            .slice(0, buttons)
            .map((style, index) => buttonMarkup(style, `Button ${index + 1}`)),
    ].join('\n\n');

/** A header with the attributes and the content of the mock, under a line that names it. */
export const headerExample = (attrs: string, content = headerContent()) =>
    `${attrs || 'no attributes'}\n\n${inHeader(content, attrs && `{${attrs}}`)}`;

/** Every value of every attribute of the header, then the attributes together. */
export const headerPreviewMarkup = [
    ...headerHeights.map((height) => headerExample(`height="${height}" bg-color="gray-light"`)),
    ...headerWidths.map((width) => headerExample(`width="${width}" bg-color="gray-light"`)),
    ...headerVerticals.flatMap((vertical) =>
        headerAligns.map((align) =>
            headerExample(
                `width="s" align="${align}" vertical="${vertical}" bg-color="gray-light"`,
                headerContent(3),
            ),
        ),
    ),
    ...headerBgColors.map((color) => headerExample(`bg-color="${color}"`)),
    ...headerBgImageThemes.flatMap((theme) => [
        headerExample(`bg-image="${headerImages.light}" bg-image-theme="${theme}"`),
        headerExample(`bg-image="${headerImages.dark}" bg-image-theme="${theme}"`),
    ]),
    headerExample(`bg-image="${headerImages.contrast}" bg-image-theme="dark"`),
    headerExample(`bg-image="${headerImages.contrast}" bg-image-theme="dark" bg-image-blur="true"`),
    headerExample(
        `height="l" width="full" align="center" vertical="bottom" bg-color="violet-light" bg-image="${headerImages.dark}" bg-image-theme="dark" bg-image-blur="true"`,
        headerContent(3),
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
            headerContent(1, headerTitleMarkup(`Title of size ${size}`, {size})),
        ),
    ),
    headerTitleColorsMarkup('', 'no fill'),
    headerTitleColorsMarkup('bg-color="gray-light"', 'gray-light'),
    headerTitleColorsMarkup('bg-color="blue-heavy"', 'blue-heavy'),
    headerTitleColorsMarkup(
        `bg-image="${headerImages.dark}" bg-image-theme="dark"`,
        'a dark image',
    ),
].join('\n\n');
