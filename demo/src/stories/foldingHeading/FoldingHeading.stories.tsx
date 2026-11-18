import type {Meta, StoryObj} from '@storybook/react';

import {FoldingHeadingExample} from './FoldingHeading';

export default {
    title: 'Extensions / YFM / FoldingHeading',
    component: FoldingHeadingExample,
} satisfies Meta<typeof FoldingHeadingExample>;
export const FoldingHeading: StoryObj<typeof FoldingHeadingExample> = {};
