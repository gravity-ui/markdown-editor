import type {Meta, StoryObj} from '@storybook/react';

import {TermExample} from './Term';

export default {
    title: 'Extensions / YFM / Term',
    component: TermExample,
} satisfies Meta<typeof TermExample>;

export const YfmTerm: StoryObj<typeof TermExample> = {};
