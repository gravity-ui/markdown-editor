import type {StoryObj} from '@storybook/react';

import {EditorWithLineNumbers as component} from './Editor';

export const Story: StoryObj<typeof component> = {
    args: {},
};
Story.storyName = 'Line Numbers';

export default {
    title: 'Examples / Line Numbers',
    component,
};
