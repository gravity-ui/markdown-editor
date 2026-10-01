import type {StoryObj} from '@storybook/react';

import {EditorWithCutContentFilter as component} from './Editor';

export const Story: StoryObj<typeof component> = {
    args: {},
};
Story.storyName = 'Cut Content Filter';

export default {
    title: 'Examples / Cut Content Filter',
    component,
};
