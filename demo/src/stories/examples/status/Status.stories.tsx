import type {StoryObj} from '@storybook/react';

import {StatusDemo as component} from './Status';

export const Story: StoryObj<typeof component> = {
    args: {
        mode: 'wysiwyg',
    },
};
Story.storyName = 'Status';

export const RingOutline: StoryObj<typeof component> = {
    args: {
        mode: 'wysiwyg',
        ring: 'outline',
    },
};
RingOutline.storyName = 'Selection ring: outline';

export const RingShadow: StoryObj<typeof component> = {
    args: {
        mode: 'wysiwyg',
        ring: 'shadow',
    },
};
RingShadow.storyName = 'Selection ring: box-shadow';

export const RingPseudo: StoryObj<typeof component> = {
    args: {
        mode: 'wysiwyg',
        ring: 'pseudo',
    },
};
RingPseudo.storyName = 'Selection ring: ::after';

export default {
    title: 'Examples / Status',
    component,
};
