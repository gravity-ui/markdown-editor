import type {Meta, StoryObj} from '@storybook/react';

import {ButtonEditor} from './Button';

export const Editor: StoryObj<typeof ButtonEditor> = {};

const meta: Meta<typeof ButtonEditor> = {
    title: 'Examples / Button',
    component: ButtonEditor,
};
export default meta;
