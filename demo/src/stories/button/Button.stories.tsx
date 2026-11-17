import {buttonViewColors} from '@gravity-ui/markdown-plugin-header';
import type {Meta, StoryObj} from '@storybook/react';

import {ButtonExample} from './Button';

export default {
    title: 'Extensions / Landing / Button',
    component: ButtonExample,
} satisfies Meta<typeof ButtonExample>;

const capitalize = (value: string) => value[0].toUpperCase() + value.slice(1);

const viewsAndColors = Object.entries(buttonViewColors)
    .map(([view, colors]) =>
        [
            `### ${capitalize(view)}`,
            colors
                .map(
                    (color) =>
                        `:button[${capitalize(color)}]{href="https://example.com" view="${view}" color="${color}"}`,
                )
                .join(' '),
        ].join('\n\n'),
    )
    .join('\n\n');

export const Button: StoryObj<typeof ButtonExample> = {
    args: {
        initial: `
## In a paragraph

Press :button[Start]{href="https://example.com/start" view="action" color="blue"} to begin, or read :button[the docs]{href="https://example.com/docs" view="outline" color="gray"} first.

## A row of buttons

:button[Save]{href="https://example.com/save" view="action" color="standard"} :button[Preview]{href="https://example.com/preview" view="normal" color="gray"} :button[Share]{href="https://example.com/share" view="outline" color="blue"} :button[Cancel]{href="https://example.com/cancel" view="flat" color="standard"}

## Views and colors

${viewsAndColors}

## With and without a link

:button[With a link]{href="https://example.com" view="action" color="blue"} :button[In a new tab]{href="https://example.com" view="normal" color="blue" target="_blank"} :button[Without a link]{view="outline" color="blue"}

## In a header

:::header{height="s" width="m"}

### Buttons in a header

:button[Primary]{href="https://example.com" view="action" color="blue"} :button[Secondary]{href="https://example.com" view="normal" color="gray"} :button[Tertiary]{view="flat" color="standard"}

:::
`.trim(),
    },
};
