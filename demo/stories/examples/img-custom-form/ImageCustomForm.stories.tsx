import type {StoryObj} from '@storybook/react';

import {ImageCustomFormDemo as component} from './ImageCustomForm';

export const Story: StoryObj<typeof component> = {
    args: {},
};
Story.storyName = 'Custom Image Widget';

export default {
    title: 'Examples / Custom Image Widget',
    component,
};
