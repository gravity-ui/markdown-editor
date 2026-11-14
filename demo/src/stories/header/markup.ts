import {
    type ButtonColor,
    type ButtonView,
    buttonColors,
    buttonViewColors,
    buttonViews,
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

export const buttonStylesMarkup = `${buttonRowsMarkup()}\n\n${inHeader(buttonRowsMarkup())}`;
