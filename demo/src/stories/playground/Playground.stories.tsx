import type {Meta, StoryObj} from '@storybook/react';

import {type PlaygroundProps, Playground as component} from '../../components/Playground';
import {args} from '../../defaults/args';
import {getInitialMd} from '../../utils/getInitialMd';

export const Story: StoryObj<typeof component> = {
    args: {
        mobile: false,
        disableMarkdownItAttrs: true,
        initialTabFocusMode: 'indent',
    },
};
Story.storyName = 'Playground';

const meta: Meta<PlaygroundProps> = {
    title: 'Playground',
    component,
    args,
    argTypes: {
        initialTabFocusMode: {
            control: 'inline-radio',
            options: ['indent', 'focus'],
            description:
                'Initial Tab behavior: editor commands (indent) or native focus navigation (focus).',
        },
    },
    beforeEach: (context) => {
        /* eslint-disable no-param-reassign */
        context.args.initial = getInitialMd();
        /* eslint-enable no-param-reassign */
    },
};
export default meta;
