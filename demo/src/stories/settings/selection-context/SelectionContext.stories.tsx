import type {Meta, StoryObj} from '@storybook/react';

import {type SelectionContextProps, SelectionContext as component} from './SelectionContext';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Selection context';

const meta: Meta<SelectionContextProps> = {
    args: {
        flip: false,
        placement: 'bottom',
    },
    component,
    title: 'Settings / Wysiwyg / Selection context',
};

export default meta;
