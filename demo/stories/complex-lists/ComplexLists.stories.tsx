import type {StoryObj} from '@storybook/react';

import {PlaygroundMini as component} from '../../components/PlaygroundMini';
import {args} from '../../defaults/args';
import {excludedControls} from '../../defaults/excluded-controls';

import {markup} from './markup';

export const Lists: StoryObj<typeof component> = {
    args: {initial: markup.lists},
};

export default {
    title: 'Experiments / Complex Markup',
    component,
    args: args,
    parameters: {
        controls: {
            exclude: excludedControls.concat('directiveSyntax'),
        },
    },
};
