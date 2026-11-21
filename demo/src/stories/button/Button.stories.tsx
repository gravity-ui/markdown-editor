import type {StoryObj} from '@storybook/react';

import {PlaygroundMini as component} from '../../components/PlaygroundMini';
import {args} from '../../defaults/args';
import {excludedControls} from '../../defaults/excluded-controls';

import {buttonCanvas} from './canvas';

export const Button: StoryObj<typeof component> = {
    args: {initial: buttonCanvas},
};

export default {
    title: 'Extensions / Landing / Button',
    component,
    args,
    parameters: {
        controls: {
            exclude: excludedControls,
        },
    },
};
