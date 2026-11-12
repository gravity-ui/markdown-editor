import type {Meta, StoryObj} from '@storybook/react';

import {ButtonExample} from './Button';

export default {
    title: 'Extensions / Landing / Button',
    component: ButtonExample,
    argTypes: {palette: {table: {disable: true}}},
} satisfies Meta<typeof ButtonExample>;

export const Button: StoryObj<typeof ButtonExample> = {};

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
    ...['brand', 'green', 'yellow', 'red', 'violet'].map((color) =>
        ['action', 'normal', 'outline', 'flat'].map((view) => [view, color]),
    ),
];

export const Colors: StoryObj<typeof ButtonExample> = {
    name: 'States',
    args: {
        palette: true,
        initial: buttonRows
            .flat()
            .map(([view, color]) => `:::button{view="${view}" color="${color}"}\nКнопка\n:::`)
            .join('\n\n'),
    },
};
