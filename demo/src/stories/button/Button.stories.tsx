import type {Meta, StoryObj} from '@storybook/react';

import {ButtonExample} from './Button';

export default {
    title: 'Extensions / Landing / Button',
    component: ButtonExample,
} satisfies Meta<typeof ButtonExample>;

export const Button: StoryObj<typeof ButtonExample> = {};

const buttons = [
    ['action', 'standard'],
    ['flat', 'standard'],
    ['normal', 'gray'],
    ['outline', 'gray'],
    ['flat', 'gray'],
    ...['blue', 'green', 'yellow', 'red', 'violet'].flatMap((color) =>
        ['action', 'normal', 'outline', 'flat'].map((view) => [view, color]),
    ),
];

export const Colors: StoryObj<typeof ButtonExample> = {
    name: 'States',
    args: {
        initial: buttons
            .map(([view, color]) => `:::button{view="${view}" color="${color}"}\nКнопка\n:::`)
            .join('\n\n'),
    },
};
