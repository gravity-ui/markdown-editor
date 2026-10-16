import type {StoryObj} from '@storybook/react';

import {MarkdownViewerDemo} from './MarkdownViewerDemo';

export const Story: StoryObj<typeof MarkdownViewerDemo> = {};
Story.storyName = 'Markdown Viewer';

export default {
    title: 'Viewer / Markdown Viewer',
    component: MarkdownViewerDemo,
};
