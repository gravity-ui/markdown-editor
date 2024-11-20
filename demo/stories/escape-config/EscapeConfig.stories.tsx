import type {StoryObj} from '@storybook/react';

import {EscapeConfig as component} from './EscapeConfig';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Escape config';

export default {
    args: {
        initialEditor: 'wysiwyg',
        commonEscapeRegexp: '^$',
        startOfLineEscapeRegexp: '^$',
        withDefaultInitialContent: true,
    },
    component,
    title: 'Experiments / Escape config',
};
