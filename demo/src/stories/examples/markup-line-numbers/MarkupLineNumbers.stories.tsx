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
