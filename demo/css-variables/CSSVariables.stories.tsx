import type {Meta, StoryObj} from '@storybook/react';

import {CustomCSSVariablesDemo} from './CSSVariablesDemo';

const meta: Meta = {
    title: 'Experiments / Custom CSS Variables',
    component: CustomCSSVariablesDemo,
};

export default meta;

type Story = StoryObj<typeof CustomCSSVariablesDemo>;

export const CustomCSSVariables: Story = {
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
        '--g-md-editor-padding': {
            control: {type: 'text'},
            description: 'Editor contents padding',
        },
    },
};
