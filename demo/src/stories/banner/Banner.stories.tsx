import type {StoryObj} from '@storybook/react';

import {PlaygroundMini as component} from '../../components/PlaygroundMini';
import {args} from '../../defaults/args';
import {excludedControls} from '../../defaults/excluded-controls';

import {bannerCanvas} from './canvas';

export const Banner: StoryObj<typeof component> = {
    args: {initial: bannerCanvas},
};

export default {
    title: 'Extensions / Landing / Banner',
    component,
    args,
    parameters: {
        controls: {
            exclude: excludedControls,
        },
    },
};
