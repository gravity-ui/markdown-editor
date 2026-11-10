import type {Meta, StoryObj} from '@storybook/react';

import {LabelExample} from './Label';

export default {
    title: 'Extensions / Label',
    component: LabelExample,
} satisfies Meta<typeof LabelExample>;
export const Label: StoryObj<typeof LabelExample> = {};
