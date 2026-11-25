import type {StoryObj} from '@storybook/react';

import {GridBlockDemo as component} from './GridBlock';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Grid block';

export default {
    title: 'Examples / Grid block',
    component,
};
