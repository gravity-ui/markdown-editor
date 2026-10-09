import type {StoryObj} from '@storybook/react';

import {CustomCSSVariablesDemo as component} from './CSSVariables';

export const Story: StoryObj<typeof component> = {
    argTypes: {
        '--g-md-toolbar-padding': {
            control: {type: 'text'},
            description: 'Toolbar padding',
        },
        '--g-md-toolbar-sticky-padding': {
            control: {type: 'text'},
            description: 'Toolbar padding in sticky mode',
        },
        '--g-md-toolbar-sticky-inset': {
            control: {type: 'text'},
            description: 'Toolbar inset in sticky mode',
        },
        '--g-md-toolbar-sticky-offset': {
            control: {type: 'text'},
            description: 'Toolbar padding in sticky mode',
        },
        '--g-md-toolbar-sticky-border': {
            control: {type: 'text'},
            description: 'Toolbar border in sticky mode',
        },
        '--g-md-editor-padding': {
            control: {type: 'text'},
            description: 'Editor contents padding',
        },
    },
};
Story.storyName = 'Custom CSS Variables';

export default {
    title: 'Settings / Custom CSS Variables',
    component,
};
