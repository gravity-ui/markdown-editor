import type {StoryObj} from '@storybook/react';

import {DateDemo as component} from './Date';

export const Story: StoryObj<typeof component> = {
    args: {
        mode: 'wysiwyg',
    },
};
Story.storyName = 'Date';

export default {
    title: 'Examples / Date',
    component,
};
