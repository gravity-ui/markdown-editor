import type {Meta, StoryObj} from '@storybook/react';

import {FootnoteCatalogue, FootnoteEditor} from './Footnote';

type Story = StoryObj<typeof FootnoteCatalogue>;

const group = (name: string): Story => ({name, args: {group: name}});

export const Basic = group('Basic');
export const SharedDefinitions = group('Shared definitions');
export const ExplanationMarkdown = group('Explanation Markdown');
export const SurroundingContent = group('Surrounding content');
export const Escaping = group('Escaping');
export const EdgeCases = group('Edge cases');

/** All groups on one page. */
export const Catalogue: Story = {};

export const Editor: StoryObj = {render: () => <FootnoteEditor />};

const meta: Meta<typeof FootnoteCatalogue> = {
    title: 'Examples / Footnote',
    component: FootnoteCatalogue,
};
export default meta;
