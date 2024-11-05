import type {Meta, StoryObj} from '@storybook/react';

import {GhostDemo} from './GhostDemo';

const meta: Meta = {
    title: 'Experiments / Popup in markup mode',
    component: GhostDemo,
};

export default meta;

type Story = StoryObj<typeof GhostDemo>;

export const Ghost: Story = {};
