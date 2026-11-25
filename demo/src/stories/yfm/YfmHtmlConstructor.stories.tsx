import type {Meta, StoryObj} from '@storybook/react';

import {YfmHtmlConstructorDemo} from './YfmHtmlConstructor';

const meta: Meta<typeof YfmHtmlConstructorDemo> = {
    title: 'Extensions / YFM',
    component: YfmHtmlConstructorDemo,
};

export default meta;

type Story = StoryObj<typeof YfmHtmlConstructorDemo>;

export const YfmHtmlConstructor: Story = {
    name: 'YFM HTML Constructor',
};
