import type {StoryObj} from '@storybook/react';

import {MobileEditor as component} from './MobileEditor';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Mobile editor';

export default {
    title: 'Experiments / MobileEditor',
    component,
};
