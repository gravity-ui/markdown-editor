import type {StoryObj} from '@storybook/react';

import {CodeBlockDemo as component} from './CodeBlock';

export const Story: StoryObj<typeof component> = {
    args: {
        lineWrapping: 'disabled',
        lineNumbers: 'enabled',
    },
};
Story.storyName = 'Code block';

export default {
    title: 'Examples / Code block',
    component,
};
