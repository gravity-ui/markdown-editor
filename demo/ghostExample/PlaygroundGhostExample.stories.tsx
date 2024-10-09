import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {StoryFn} from '@storybook/react';

import {PlaygroundGhostExample} from './PlaygroundGhostExample';

export default {
    title: 'Markdown Editor / Docs example',
    component: PlaygroundGhostExample,
};

type PlaygroundStoryProps = {};
export const Playground: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundGhostExample {...props} />
);

Playground.storyName = 'Ghost';
