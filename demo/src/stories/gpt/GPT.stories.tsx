import type {StoryObj} from '@storybook/react';

import {GPT as component} from './GPT';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'GPT';

export default {
    title: 'Experiments / GPT',
    component,
};
