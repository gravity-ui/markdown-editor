import type {StoryObj} from '@storybook/react';

import {RememberMode as component} from './RememberMode';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Remember the mode';

export default {
    component,
    title: 'Experiments / Remember the mode',
};
