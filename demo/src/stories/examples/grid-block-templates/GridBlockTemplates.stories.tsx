import type {StoryObj} from '@storybook/react';

import {GridBlockTemplatesDemo as component} from './GridBlockTemplates';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Grid block templates';

export default {
    title: 'Examples / Grid block templates',
    component,
};
