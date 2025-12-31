import type {StoryObj} from '@storybook/react';

import {YfmTableDnDDemo as component} from './YfmTableDnD';

export const Story: StoryObj<typeof component> = {
    args: {
        mobile: false,
        dnd: true,
    },
};
Story.storyName = "YFM Table D'n'D";

export default {
    title: "Examples / YFM Table D'n'D",
    component,
};
