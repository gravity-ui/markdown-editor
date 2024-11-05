import type {Meta, StoryObj} from '@storybook/react';

import {defaultArgs} from '../constants/default-args';
import {getInitialMd} from '../utils/getInitialMd';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';

const meta: Meta<PlaygroundProps> = {
    title: 'Markdown Editor',
    component: PlaygroundComponent,
    args: defaultArgs,
    beforeEach: (context) => {
        /* eslint-disable no-param-reassign */
        context.args.initial = getInitialMd();
        /* eslint-enable no-param-reassign */
    },
};

export default meta;

type Story = StoryObj<typeof PlaygroundComponent>;

export const Playground: Story = {};
