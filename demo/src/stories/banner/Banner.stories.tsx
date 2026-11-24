import type {Meta, StoryObj} from '@storybook/react';

import {BannerExample} from './Banner';

export default {
    title: 'Extensions / Landing / Banner',
    component: BannerExample,
} satisfies Meta<typeof BannerExample>;
export const Banner: StoryObj<typeof BannerExample> = {};

export const Title: StoryObj<typeof BannerExample> = {
    args: {
        initial: [
            ':::banner{height="s" width="m"}',
            '::banner-title[Team portal]',
            'Everything the team needs in one place.',
            ':::',
            ':::banner{height="s" width="m"}',
            '::banner-title[Release notes]{size="1" color="blue"}',
            ':::',
            ':::banner{height="s" width="m"}',
            '::banner-title[]',
            ':::',
        ].join('\n\n'),
    },
};
