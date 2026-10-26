import type {StoryObj} from '@storybook/react';

import {MarkdownViewerDemo} from './MarkdownViewerDemo';
import {
    codeBlockDocuments,
    galleryDocuments,
    headingDocuments,
    htmlDocuments,
    latexDocuments,
    mermaidDocuments,
    pageConstructorDocuments,
} from './content';

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

export const HeadingLinks: StoryObj<typeof MarkdownViewerDemo> = {
    name: 'Heading links',
    args: {documents: headingDocuments, showFeedbackToggle: false},
};

export const Latex: StoryObj<typeof MarkdownViewerDemo> = {
    name: 'LaTeX',
    args: {documents: latexDocuments, showFeedbackToggle: false},
};

export const PageConstructor: StoryObj<typeof MarkdownViewerDemo> = {
    name: 'Page Constructor',
    args: {documents: pageConstructorDocuments, showFeedbackToggle: false},
};

export const Mermaid: StoryObj<typeof MarkdownViewerDemo> = {
    name: 'Mermaid',
    args: {
        documents: mermaidDocuments,
        showFeedbackToggle: false,
        mermaidOptions: {zoom: {showMenu: true, maximumScale: 2}},
    },
};

export const HtmlBlocks: StoryObj<typeof MarkdownViewerDemo> = {
    name: 'HTML blocks',
    args: {documents: htmlDocuments, showFeedbackToggle: false},
    parameters: {
        docs: {
            description: {
                story: `Uses the shared Diplodoc HTML controller. It searches the full document,
including other viewers and React slots. Keep HTML block hosts outside React slots.

Config applies only to new blocks. Existing iframes keep their classes and styles
when config or the theme changes. Runtime policy applies when the shared controller
is first created. Shadow mode is disabled by default, as in the editor preview.

Removing the adapter does not dispose the shared controller or its block resources.
It skips initialization after a cancelled lazy import, but cannot cancel iframe
work that the SDK has already started.`,
            },
        },
    },
};

export default {
    title: 'Viewer / Markdown Viewer',
    component: MarkdownViewerDemo,
};
