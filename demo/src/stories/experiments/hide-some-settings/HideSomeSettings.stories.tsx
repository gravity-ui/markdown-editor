import type {StoryObj} from '@storybook/react';

import {HideSomeSettingsDemo as component} from './HideSomeSettings';

export const Story: StoryObj<typeof component> = {
    args: {settingsVisilbe: ['toolbar']},
};
Story.storyName = 'Hide some settings';

export default {
    title: 'Experiments / HideSomeSettings',
    component,
};
