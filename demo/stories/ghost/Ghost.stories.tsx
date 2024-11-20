import type {StoryObj} from '@storybook/react';

import {Ghost as component} from './Ghost';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Popup in markup mode';

export default {
    title: 'Experiments / Popup in markup mode',
    component,
};
