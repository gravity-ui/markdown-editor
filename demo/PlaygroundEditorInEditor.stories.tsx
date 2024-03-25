import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {ComponentMeta, Story} from '@storybook/react';

import {PlaygroundEditorInEditor} from './editor-in-editor';

export default {
    title: 'Editor-in-Editor',
    component: PlaygroundEditorInEditor,
} as ComponentMeta<any>;

type PlaygroundStoryProps = {};
export const Playground: Story<PlaygroundStoryProps> = (props) => (
    <PlaygroundEditorInEditor {...props} />
);
