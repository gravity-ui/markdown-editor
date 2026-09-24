import type {StoryObj} from '@storybook/react';

import {ResourceReplacementDemo as component} from './ResourceReplacement';

export const ProseMirror: StoryObj<typeof component> = {
    args: {initialMode: 'wysiwyg'},
};

export const CodeMirror: StoryObj<typeof component> = {
    args: {initialMode: 'markup'},
};

export default {
    title: 'Experiments / Resource Replacement',
    component,
};
