import type {Meta, StoryObj} from '@storybook/react';

import {HeaderEditor} from './Header';

export const Editor: StoryObj<typeof HeaderEditor> = {};

const meta: Meta<typeof HeaderEditor> = {
    title: 'Examples / Header',
    component: HeaderEditor,
};
export default meta;
