import type {Meta, StoryObj} from '@storybook/react';

import {MarkupLineNumbersEditor} from './Editor';

const meta: Meta<typeof MarkupLineNumbersEditor> = {
    title: 'Examples / Markup Line Numbers',
    component: MarkupLineNumbersEditor,
};

export default meta;

type Story = StoryObj<typeof MarkupLineNumbersEditor>;

export const LineNumbersOnly: Story = {
    args: {
        lineNumbers: {enabled: true},
    },
};
LineNumbersOnly.storyName = 'Line Numbers Only';

export const HighlightLine: Story = {
    args: {
        lineNumbers: {enabled: true, highlightLines: true},
    },
};
HighlightLine.storyName = 'Highlight Line';

export const HighlightMultipleLines: Story = {
    args: {
        lineNumbers: {
            enabled: true,
            highlightLines: true,
            initialSelectedLines: {from: 5, to: 10},
        },
    },
};
HighlightMultipleLines.storyName = 'Highlight Multiple Lines';

export const ScrollToLine: Story = {
    args: {
        lineNumbers: {
            enabled: true,
            scrollToLine: 20,
            initialSelectedLines: {from: 20, to: 20},
            highlightLines: true,
        },
    },
};
ScrollToLine.storyName = 'Scroll to Line';

export const AllFeatures: Story = {
    args: {
        lineNumbers: {
            enabled: true,
            highlightLines: true,
            initialSelectedLines: {from: 20, to: 25},
            scrollToLine: 20,
        },
    },
};
AllFeatures.storyName = 'All Features';
