import type {Meta, StoryObj} from '@storybook/react';

import {
    type EditorWithCutContentFilterProps,
    EditorWithCutContentFilter as component,
} from './Editor';

export const Story: StoryObj<typeof component> = {
    args: {
        unmatched: 'drop',
    },
};
Story.storyName = 'Cut Content Filter';

const meta: Meta<EditorWithCutContentFilterProps> = {
    title: 'Examples / Cut Content Filter',
    component,
    argTypes: {
        unmatched: {
            control: 'inline-radio',
            options: ['drop', 'preserve'],
        },
    },
};
export default meta;
