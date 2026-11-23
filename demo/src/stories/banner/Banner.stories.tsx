import type {Meta, StoryObj} from '@storybook/react';

import {BannerExample} from './Banner';

export default {
    title: 'Extensions / Landing / Banner',
    component: BannerExample,
} satisfies Meta<typeof BannerExample>;
export const Banner: StoryObj<typeof BannerExample> = {};
