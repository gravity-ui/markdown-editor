import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {StoryFn} from '@storybook/react';

import {PlaygroundGPT} from './PlaygroundGPT';

export default {
    title: 'Experiments / GPT',
    component: PlaygroundGPT,
};

type PlaygroundStoryProps = {};
export const Playground: StoryFn<PlaygroundStoryProps> = (props) => <PlaygroundGPT {...props} />;

Playground.storyName = 'Playground GPT';
