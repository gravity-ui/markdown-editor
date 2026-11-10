import type {StoryObj} from '@storybook/react';

import {EditorWithStickyInContainer as component} from './Editor';

export const Story: StoryObj<typeof component> = {
    args: {},
};
Story.storyName = 'Sticky Toolbar in Scroll Container';

export default {
    title: 'Experiments / Sticky Toolbar in Scroll Container',
    component,
};
