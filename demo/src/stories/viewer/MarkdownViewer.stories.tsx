import type {StoryObj} from '@storybook/react';

import {markup} from '../../defaults/content';

import {Viewer} from './MarkdownViewer';

export const Story: StoryObj<typeof Viewer> = {
    args: {
        markdown: markup,
    },
};
Story.storyName = 'Markdown Viewer';

export default {
    title: 'Viewer / Markdown Viewer',
    component: Viewer,
};
