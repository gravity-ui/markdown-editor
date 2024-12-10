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
        '--g-md-wysiwyg-selection-border': {
            control: {type: 'text'},
            description: 'Editor selection border',
        },
        '--g-md-wysiwyg-selection-border-radius': {
            control: {type: 'text'},
            description: 'Editor selection border radius',
        },
        '--g-md-wysiwyg-selection-outline': {
            control: {type: 'text'},
            description: 'Editor selection outline',
        },
        '--g-md-wysiwyg-selection-background': {
            control: {type: 'text'},
            description: 'Editor selection background',
        },
        '--g-md-wysiwyg-selection-box-shadow': {
            control: {type: 'text'},
            description: 'Editor selection box-shadow',
        },
    },
};
Story.storyName = 'Custom CSS Variables';

export default {
    title: 'Experiments / Custom CSS Variables',
    component,
};
