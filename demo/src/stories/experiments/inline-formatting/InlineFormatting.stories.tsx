import type {Meta, StoryObj} from '@storybook/react';

import {InlineFormattingDemo as component} from './InlineFormatting';

export const Story: StoryObj<typeof component> = {
    args: {
        structuralInlineFormatting: true,
    },
};
Story.storyName = 'Inline formatting';

const meta: Meta<typeof component> = {
    title: 'Experiments / Inline formatting',
    component,
    argTypes: {
        structuralInlineFormatting: {
            name: 'Structural inline formatting',
            control: 'boolean',
        },
    },
};
export default meta;
