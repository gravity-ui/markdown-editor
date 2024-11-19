import type {Meta, StoryObj} from '@storybook/react';

import {EscapeConfigDemo, EscapeConfigDemoProps} from './EscapeConfigDemo';

const args: Meta<EscapeConfigDemoProps>['args'] = {
    initialEditor: 'wysiwyg',
    commonEscapeRegexp: '^$',
    startOfLineEscapeRegexp: '^$',
    withDefaultInitialContent: true,
};

const meta: Meta<EscapeConfigDemoProps> = {
    component: EscapeConfigDemo,
    title: 'Experiments / Escape config',
    args,
};

export default meta;

type Story = StoryObj<typeof EscapeConfigDemo>;

export const EscapeConfig: Story = {};
