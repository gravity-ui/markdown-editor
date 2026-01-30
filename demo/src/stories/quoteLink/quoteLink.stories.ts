import type {StoryObj} from '@storybook/react';

import {QuoteLink as component} from './QuoteLink';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'QuoteLink';

export default {
    title: 'Extensions / YFM / QuoteLink',
    component,
};
