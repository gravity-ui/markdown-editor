import type {Meta, StoryObj} from '@storybook/react';

import {SectionExample} from './Section';

export default {
    title: 'Extensions / Landing / Section',
    component: SectionExample,
} satisfies Meta<typeof SectionExample>;

export const Section: StoryObj<typeof SectionExample> = {};
