import type {StoryObj} from '@storybook/react';

import {MarkdownViewerDemo} from './MarkdownViewerDemo';
import {codeBlockDocuments, galleryDocuments} from './content';

export const Story: StoryObj<typeof MarkdownViewerDemo> = {};
Story.storyName = 'Markdown Viewer';

export const CodeBlockActions: StoryObj<typeof MarkdownViewerDemo> = {
    name: 'Code block actions',
    args: {documents: codeBlockDocuments, showFeedbackToggle: false},
};

export const FilesGallery: StoryObj<typeof MarkdownViewerDemo> = {
    name: 'Files gallery',
    args: {documents: galleryDocuments, showFeedbackToggle: false},
};

export default {
    title: 'Viewer / Markdown Viewer',
    component: MarkdownViewerDemo,
};
