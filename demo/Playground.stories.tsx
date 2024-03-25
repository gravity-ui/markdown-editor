import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {ComponentMeta, Story} from '@storybook/react';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';
import {parseLocation} from './location';
import {initialMdContent} from './md-content';

export default {
    title: 'YFM Editor',
    component: PlaygroundComponent,
} as ComponentMeta<any>;

type PlaygroundStoryProps = Pick<
    PlaygroundProps,
    | 'initialEditor'
    | 'settingsVisible'
    | 'breaks'
    | 'allowHTML'
    | 'linkify'
    | 'linkifyTlds'
    | 'sanitizeHtml'
    | 'prepareRawMarkup'
    | 'splitModeOrientation'
    | 'stickyToolbar'
    | 'initialSplitModeEnabled'
    | 'renderPreviewDefined'
    | 'height'
>;
export const Playground: Story<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={parseLocation() || initialMdContent} />
);

Playground.args = {
    initialEditor: 'wysiwyg',
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    sanitizeHtml: false,
    prepareRawMarkup: false,
    splitModeOrientation: 'horizontal',
    stickyToolbar: true,
    initialSplitModeEnabled: false,
    renderPreviewDefined: true,
    height: 'initial',
};
