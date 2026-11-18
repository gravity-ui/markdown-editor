import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';

export default {
    title: 'Extensions / Landing / Header',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;
export const Header: StoryObj<typeof HeaderExample> = {};

export const Title: StoryObj<typeof HeaderExample> = {
    args: {
        initial: [
            ':::header{height="s" width="m"}',
            '::header-title[Team portal]',
            'Everything the team needs in one place.',
            ':::',
            ':::header{height="s" width="m"}',
            '::header-title[Release notes]{size="1" color="blue"}',
            ':::',
            'After',
        ].join('\n\n'),
    },
};
