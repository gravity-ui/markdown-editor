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
        mode: 'markup',
        initial:
            ':::button{href="https://example.com" view="action" color="blue"}\nRead more\n:::\n\n:::header{height="s" width="m"}\n\n# Welcome\n\n:::button{href="/help" view="outline" color="green"}\nHelp\n:::\n\n:::',
    },
};

const buttonColors = {
    action: ['standard', 'blue', 'green', 'yellow', 'red', 'violet'],
    normal: ['gray', 'blue', 'green', 'yellow', 'red', 'violet'],
    outline: ['gray', 'blue', 'green', 'yellow', 'red', 'violet'],
    flat: ['standard', 'gray', 'blue', 'green', 'yellow', 'red', 'violet'],
};

export const Colors: StoryObj<typeof HeaderExample> = {
    args: {
        width: 760,
        initial: Object.entries(buttonColors)
            .map(([view, colors]) =>
                [
                    view,
                    ...colors.map(
                        (color) => `:::button{view="${view}" color="${color}"}\n${color}\n:::`,
                    ),
                ].join('\n\n'),
            )
            .join('\n\n'),
    },
};
