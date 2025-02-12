import type {Meta, StoryObj} from '@storybook/react';

import {PlaygroundMini, type PlaygroundMiniProps} from '../../components/PlaygroundMini';
import {args} from '../../defaults/args';
import {excludedControls} from '../../defaults/excluded-controls';

import {markup} from './content';

const meta: Meta<PlaygroundMiniProps> = {
    title: 'Extensions / YFM',
    component: PlaygroundMini,
    args: args,
    parameters: {
        controls: {
            exclude: excludedControls,
        },
    },
};

export default meta;

type Story = StoryObj<typeof PlaygroundMini>;

export const TextMarks: Story = {
    name: 'Text',
    args: {initial: 'wtf'},
};

export const Tasklist: Story = {
    name: 'Task list',
    args: {initial: markup.tasklist},
};

export const FoldingHeadings: Story = {
    name: 'Folding headings',
    args: {initial: markup.foldingHeadings},
};

export const YfmNote: Story = {
    name: 'YFM Note',
    args: {initial: markup.yfmNotes},
};

export const YfmCut: Story = {
    name: 'YFM Cut',
    args: {initial: markup.yfmCut},
};

export const YfmTabs: Story = {
    name: 'YFM Tabs',
    args: {initial: markup.yfmTabs},
};

export const YfmHtmlBlock: Story = {
    name: 'YFM HTML',
    args: {initial: markup.yfmHtmlBlock},
};

export const YfmFile: Story = {
    name: 'YFM File',
    args: {initial: markup.yfmFile},
};

export const YfmTable: Story = {
    name: 'YFM Table',
    args: {initial: markup.yfmTable},
};

export const LaTeXFormulas: Story = {
    name: 'LaTeX Formulas',
    args: {initial: markup.latexFormulas},
};

export const MermaidDiagram: Story = {
    name: 'Mermaid diagram',
    args: {initial: markup.mermaidDiagram},
};
