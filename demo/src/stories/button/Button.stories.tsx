import type {Meta, StoryObj} from '@storybook/react';

import {ButtonExample} from './Button';

export default {
    title: 'Extensions / Landing / Button',
    component: ButtonExample,
} satisfies Meta<typeof ButtonExample>;

export const Button: StoryObj<typeof ButtonExample> = {};

const rows = [
    [
        ['action', 'standard'],
        ['flat', 'standard'],
    ],
    [
        ['normal', 'gray'],
        ['outline', 'gray'],
        ['flat', 'gray'],
    ],
    ...['info', 'green', 'yellow', 'red', 'violet'].map((color) =>
        ['action', 'normal', 'outline', 'flat'].map((view) => [view, color]),
    ),
];

export const Colors: StoryObj<typeof ButtonExample> = {
    name: 'States',
    args: {
        initial: rows
            .map((row) =>
                row
                    .map(([view, color]) => `:button[Кнопка]{view="${view}" color="${color}"}`)
                    .join(' '),
            )
            .join('\n\n'),
    },
};
