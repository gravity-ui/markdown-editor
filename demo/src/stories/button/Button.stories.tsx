import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from '../header/Header';

export default {
    title: 'Extensions / Landing / Button',
    component: HeaderExample,
    args: {width: 660},
} satisfies Meta<typeof HeaderExample>;

export const Button: StoryObj<typeof HeaderExample> = {
    args: {
        initial: ':::button{href="https://example.com"}\nRead more\n:::\n\nAfter',
    },
};

export const InHeader: StoryObj<typeof HeaderExample> = {
    args: {
        initial:
            ':::header{height="s" width="m"}\n\n# Welcome\n\n:::button{href="/help" view="outline" color="green"}\nHelp\n:::\n\n:::',
    },
};

// The order of the design: `standard` and `gray` first, then one row per color.
const buttonRows = [
    [
        ['action', 'standard'],
        ['flat', 'standard'],
    ],
    [
        ['normal', 'gray'],
        ['outline', 'gray'],
        ['flat', 'gray'],
    ],
    ...['blue', 'green', 'yellow', 'red', 'violet'].map((color) =>
        ['action', 'normal', 'outline', 'flat'].map((view) => [view, color]),
    ),
];

export const Colors: StoryObj<typeof HeaderExample> = {
    args: {
        initial: buttonRows
            .flat()
            .map(([view, color]) => `:::button{view="${view}" color="${color}"}\nButton\n:::`)
            .join('\n\n'),
    },
};
