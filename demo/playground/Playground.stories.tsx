import type {Meta, StoryObj} from '@storybook/react';

import {defaultArgs} from '../constants/default-args';

import {PlaygroundMini, PlaygroundMiniProps} from './PlaygroundMini';

const meta: Meta<PlaygroundMiniProps> = {
    title: 'Markdown Editor',
    component: PlaygroundMini,
    args: {...defaultArgs, withDefaultInitialContent: true},
};

export default meta;

type Story = StoryObj<typeof PlaygroundMini>;

export const Playground: Story = {};
