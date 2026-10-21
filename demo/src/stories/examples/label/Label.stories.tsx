import type {StoryObj} from '@storybook/react';

import {LabelDemo as component} from './Label';

export const Story: StoryObj<typeof component> = {
    args: {
        mode: 'wysiwyg',
    },
};
Story.storyName = 'Label';

export default {
    title: 'Examples / Label',
    component,
};
