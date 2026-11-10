import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';

export default {
    title: 'Extensions / Landing / Header',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;
export const Header: StoryObj<typeof HeaderExample> = {};
