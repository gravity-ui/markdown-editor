import type {StoryObj} from '@storybook/react';

import {YfmHtmlConstructorDemo as component} from './YfmHtmlConstructor';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'YFM HTML Constructor';

export default {
    title: 'Examples / YFM HTML Constructor',
    component,
};
