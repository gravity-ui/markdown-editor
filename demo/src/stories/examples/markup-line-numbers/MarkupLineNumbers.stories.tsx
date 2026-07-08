import type {Meta, StoryObj} from '@storybook/react';

import {MarkupLineNumbersEditor} from './Editor';

const meta: Meta<typeof MarkupLineNumbersEditor> = {
    title: 'Examples / Markup Line Numbers',
    component: MarkupLineNumbersEditor,
};

export default meta;

type Story = StoryObj<typeof MarkupLineNumbersEditor>;

export const InitialSelectionSingleLine: Story = {
    args: {
        lineNumbers: {
            enabled: true,
            initialSelection: {lineFrom: 20},
        },
    },
};
InitialSelectionSingleLine.storyName = 'Initial Selection: Single Line';

export const InitialSelectionRange: Story = {
    args: {
        lineNumbers: {
            enabled: true,
            initialSelection: {lineFrom: 5, lineTo: 10},
        },
    },
};
InitialSelectionRange.storyName = 'Initial Selection: Line Range';

export const WithoutLineNumbers: Story = {
    args: {
        lineNumbers: {
            enabled: false,
            initialSelection: {lineFrom: 5, lineTo: 10},
        },
    },
};
InitialSelectionRange.storyName = 'Selection without line numbers';
