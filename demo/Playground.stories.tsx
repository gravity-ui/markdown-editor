import React from 'react';
import {ComponentMeta, Story} from '@storybook/react';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';
import {initialMdContent} from './md-content';

export default {
    title: 'YFM Editor',
} as ComponentMeta<any>;

type PlaygroundStoryProps = Pick<PlaygroundProps, 'breaks' | 'allowHTML' | 'linkify'>;
export const Playground: Story<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={initialMdContent} />
);

Playground.args = {
    allowHTML: true,
    breaks: true,
    linkify: true,
};
