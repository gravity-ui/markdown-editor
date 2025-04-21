import type {StoryObj} from '@storybook/react';

import {StoreRawMarkupDemo as component} from './StoreRawMarkup';

export const Story: StoryObj<typeof component> = {
    args: {preserveMarkupFormattingFeatures: ['yfm_table', 'hidden_comment']},
};
Story.storyName = 'Store Raw Markup';

export default {
    title: 'Experiments',
    component,
};
