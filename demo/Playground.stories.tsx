import React from 'react';

import type {ComponentMeta, Story} from '@storybook/react'; // eslint-disable-line import/no-extraneous-dependencies

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';
import {initialMdContent} from './md-content';

export default {
    title: 'YFM Editor',
} as ComponentMeta<any>;

type PlaygroundStoryProps = Pick<
    PlaygroundProps,
    'breaks' | 'allowHTML' | 'linkify' | 'linkifyTlds'
>;
export const Playground: Story<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={initialMdContent} />
);

Playground.args = {
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
};
