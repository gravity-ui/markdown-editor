import type {Meta, StoryObj} from '@storybook/react';

import {PlaygroundGPTDemo} from './PlaygroundGPTDemo';

const meta: Meta = {
    title: 'Experiments / GPT',
    component: PlaygroundGPTDemo,
};

export default meta;

type Story = StoryObj<typeof PlaygroundGPTDemo>;

export const Playground: Story = {};
