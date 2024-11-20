import {StoryObj} from '@storybook/react';

import {EditorInEditor as component} from './EditorInEditor';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Editor in editor';

export default {
    component,
    title: 'Experiments / Editor in editor',
};
