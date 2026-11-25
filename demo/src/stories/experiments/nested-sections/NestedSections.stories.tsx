import type {StoryObj} from '@storybook/react';

import {NestedSections as component} from './NestedSections';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Nested sections';

export default {
    title: 'Experiments / Nested sections',
    component,
};
