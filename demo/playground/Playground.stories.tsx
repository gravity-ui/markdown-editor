import type {Meta, StoryObj} from '@storybook/react';

import {defaultArgs} from '../constants/default-args';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';

const meta: Meta<PlaygroundProps> = {
    title: 'Markdown Editor',
    component: PlaygroundComponent,
    args: defaultArgs,
};

export default meta;

type Story = StoryObj<typeof PlaygroundComponent>;

export const Playground: Story = {};
