import type {Meta, StoryObj} from '@storybook/react';

import {Playground as PlaygroundComponent, PlaygroundProps} from '../../Playground';
import {args} from '../../defaults/args';
import {getInitialMd} from '../../utils/getInitialMd';

const meta: Meta<PlaygroundProps> = {
    title: 'Markdown Editor',
    component: PlaygroundComponent,
    args: args,
    beforeEach: (context) => {
        /* eslint-disable no-param-reassign */
        context.args.initial = getInitialMd();
        /* eslint-enable no-param-reassign */
    },
};

export default meta;

type Story = StoryObj<typeof PlaygroundComponent>;

export const Playground: Story = {};
