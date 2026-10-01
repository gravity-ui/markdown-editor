import type {Meta, StoryObj} from '@storybook/react';

import {MarkupLineNumbersEditor} from './Editor';

const meta: Meta<typeof MarkupLineNumbersEditor> = {
    title: 'Examples / Markup Line Numbers',
    component: MarkupLineNumbersEditor,
};

export default meta;

type Story = StoryObj<typeof MarkupLineNumbersEditor>;

export const Enabled: Story = {
    args: {
        lineNumbers: {
            enabled: true,
        },
    },
};
Enabled.storyName = 'Enabled';

export const Disabled: Story = {
    args: {
        lineNumbers: {
            enabled: false,
        },
    },
};
Disabled.storyName = 'Disabled';

export const InitialSelectionSingleLine: Story = {
    args: {
        lineNumbers: {
            enabled: true,
        },
        initialSelection: {lineFrom: 20},
    },
};
InitialSelectionSingleLine.storyName = 'Initial Selection: Single Line';

export const InitialSelectionRange: Story = {
    args: {
        lineNumbers: {
            enabled: true,
        },
        initialSelection: {lineFrom: 5, lineTo: 10},
    },
};
InitialSelectionRange.storyName = 'Initial Selection: Line Range';

export const SelectionWithoutLineNumbers: Story = {
    args: {
        lineNumbers: {
            enabled: false,
        },
        initialSelection: {lineFrom: 5, lineTo: 10},
    },
};
SelectionWithoutLineNumbers.storyName = 'Selection without line numbers';
