import type {Meta, StoryObj} from '@storybook/react';

import {PlaygroundProps, Playground as component} from '../../components/Playground';
import {args} from '../../defaults/args';
import {getInitialMd} from '../../utils/getInitialMd';

export const Story: StoryObj<typeof component> = {};
Story.storyName = 'Playground';

const meta: Meta<PlaygroundProps> = {
    title: 'Playground',
    component: component,
    args: args,
    beforeEach: (context) => {
        /* eslint-disable no-param-reassign */
        context.args.initial = getInitialMd();
        /* eslint-enable no-param-reassign */
    },
};
export default meta;
