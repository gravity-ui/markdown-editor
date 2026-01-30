import type {StoryObj} from '@storybook/react';

import {PreserveEmptyRowsDemo as component} from './EmptyRows';

export const Story: StoryObj<typeof component> = {
    args: {
        preserveEmptyRows: true,
    },
};
Story.storyName = 'Preserve Empty Rows';

export default {
    title: 'Experiments / Preserve Empty Rows',
    component,
};
