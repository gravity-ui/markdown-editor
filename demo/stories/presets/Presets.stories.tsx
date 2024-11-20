import {StoryObj} from '@storybook/react';

import {Preset as component} from './Preset';

export const Zero: StoryObj<typeof component> = {
    args: {preset: 'zero'},
};

export const CommonMark: StoryObj<typeof component> = {
    args: {preset: 'commonmark'},
};

export const Default: StoryObj<typeof component> = {
    args: {preset: 'default'},
};

export const YFM: StoryObj<typeof component> = {
    args: {preset: 'yfm'},
};

export const Full: StoryObj<typeof component> = {
    args: {preset: 'full'},
};

export default {
    component,
    title: 'Markdown Editor / Presets',
    args: {
        settingsVisible: true,
        allowHTML: true,
        breaks: true,
        linkify: true,
        linkifyTlds: [],
        splitModeOrientation: 'horizontal',
        stickyToolbar: true,
        height: 'initial',
    },
    parameters: {controls: {exclude: ['preset']}},
};
