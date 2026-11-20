import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';

export default {
    title: 'Extensions / Landing / Header',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;
export const Header: StoryObj<typeof HeaderExample> = {};

export const Image: StoryObj<typeof HeaderExample> = {
    args: {
        initial: [
            ':::header{height="s" width="s"}',
            '::header-image{src="assets/header-image-landscape.svg" alt="Team"}',
            'Everything the team needs in one place: the handbook and the release calendar.',
            ':::',
            ':::header{height="s" width="s"}',
            '::header-image',
            'A placeholder of an image without an address.',
            ':::',
            'After',
        ].join('\n\n'),
    },
};
