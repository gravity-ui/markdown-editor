import {
    type ButtonColor,
    type ButtonView,
    buttonColors,
    buttonViewColors,
    buttonViews,
    headerAligns,
    headerBgColors,
    headerBgImageThemes,
    headerHeights,
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

/** The content of the mock: a title, a description and buttons, each in its own block. */
export const headerContent = (buttons = 1, title = 'Team portal', text = 'Portal description.') =>
    [
        `::header-title[${title}]`,
        `:::header-content\n${text}\n:::`,
        ...[
            ':button[Button 1]{href="/page" view="action" color="blue"}',
            ':button[Button 2]{href="/page" view="normal" color="gray"}',
            ':button[Button 3]{href="/page" view="flat" color="standard"}',
        ].slice(0, buttons),
    ].join('\n\n');

/** A header with the attributes and the content of the mock, under a line that names it. */
export const headerExample = (attrs: string, content = headerContent()) =>
    `${attrs || 'no attributes'}\n\n:::header${attrs && `{${attrs}}`}\n\n${content}\n:::`;

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
