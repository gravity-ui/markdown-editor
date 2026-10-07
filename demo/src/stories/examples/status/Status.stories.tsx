import type {StoryObj} from '@storybook/react';

import {StatusDemo as component} from './Status';

export const Story: StoryObj<typeof component> = {
    args: {
        mode: 'wysiwyg',
    },
};
Story.storyName = 'Status';

export default {
    title: 'Examples / Status',
    component,
};
