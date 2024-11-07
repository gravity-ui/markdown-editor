import {Meta, StoryObj} from '@storybook/react';

import {EditorInEditorDemo} from './EditorInEditorDemo';

const meta: Meta = {
    component: EditorInEditorDemo,
    title: 'Experiments / Editor-in-Editor',
};

export default meta;

type Story = StoryObj<typeof EditorInEditorDemo>;

export const Playground: Story = {};
