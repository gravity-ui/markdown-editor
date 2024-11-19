import {Meta as SBMeta, StoryObj} from '@storybook/react';

import {PresetDemo, PresetDemoProps} from './PresetDemo';

type Meta = SBMeta<PresetDemoProps>;

const args: Meta['args'] = {
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    splitModeOrientation: 'horizontal',
    stickyToolbar: true,
    height: 'initial',
};

const meta: Meta = {
    component: PresetDemo,
    title: 'Markdown Editor / Presets',
    args,
    parameters: {controls: {exclude: ['preset']}},
};

export default meta;

type Story = StoryObj<typeof PresetDemo>;

export const Zero: Story = {
    args: {preset: 'zero'},
};

export const CommonMark: Story = {
    args: {preset: 'commonmark'},
};

export const Default: Story = {
    args: {preset: 'default'},
};

export const YFM: Story = {
    args: {preset: 'yfm'},
};

export const Full: Story = {
    args: {preset: 'full'},
};
