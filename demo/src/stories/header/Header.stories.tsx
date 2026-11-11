import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';

export default {
    title: 'Extensions / Landing / Header',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;
export const Header: StoryObj<typeof HeaderExample> = {};

export const Buttons: StoryObj<typeof HeaderExample> = {
    args: {
        mode: 'markup',
        initial:
            ':::button{href="https://example.com" view="action" color="blue"}\nRead more\n:::\n\n:::header{height="s" width="m"}\n\n# Welcome\n\n:::button{href="/help" view="outline" color="green"}\nHelp\n:::\n\n:::',
    },
};
