import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {Meta, StoryFn} from '@storybook/react';

import {PresetDemo, PresetDemoProps} from './PresetDemo';

export default {
    title: 'Markdown Editor / Presets',
} as Meta;

type PlaygroundStoryProps = Pick<
    PresetDemoProps,
    | 'settingsVisible'
    | 'breaks'
    | 'allowHTML'
    | 'linkify'
    | 'linkifyTlds'
    | 'splitModeOrientation'
    | 'stickyToolbar'
    | 'height'
>;

const args: Partial<PlaygroundStoryProps> = {
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    splitModeOrientation: 'horizontal',
    stickyToolbar: true,
    height: 'initial',
};

export const Zero: StoryFn<PlaygroundStoryProps> = (props) => (
    <PresetDemo {...props} preset="zero" />
);

export const CommonMark: StoryFn<PlaygroundStoryProps> = (props) => (
    <PresetDemo {...props} preset="commonmark" />
);

export const Default: StoryFn<PlaygroundStoryProps> = (props) => (
    <PresetDemo {...props} preset="default" />
);

export const YFM: StoryFn<PlaygroundStoryProps> = (props) => <PresetDemo {...props} preset="yfm" />;

export const Full: StoryFn<PlaygroundStoryProps> = (props) => (
    <PresetDemo {...props} preset="full" />
);

Zero.args = args;
CommonMark.args = args;
CommonMark.storyName = 'CommonMark';
Default.args = args;
YFM.args = args;
Full.args = args;
