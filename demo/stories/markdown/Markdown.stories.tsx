import type {Meta, StoryObj} from '@storybook/react';

import {PlaygroundMini, PlaygroundMiniProps} from '../../PlaygroundMini';
import {args} from '../../defaults/args';
import {excludedControls} from '../../defaults/excluded-controls';

import {markup} from './markup';

const meta: Meta<PlaygroundMiniProps> = {
    title: 'Markdown Editor / Markdown examples',
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

export const Heading: Story = {
    args: {initial: markup.heading},
};

export const Blockquote: Story = {
    args: {initial: markup.blockquote},
};

export const Emphasis: Story = {
    args: {initial: markup.emphasis},
};

export const HorizontalRules: Story = {
    args: {initial: markup.horizontalRules},
};

export const Lists: Story = {
    args: {initial: markup.lists},
};

export const Code: Story = {
    args: {initial: markup.code},
};

export const Tables: Story = {
    args: {initial: markup.tables},
};

export const Links: Story = {
    args: {initial: markup.links},
};

export const Images: Story = {
    args: {initial: markup.images},
};

export const SubSup: Story = {
    name: 'Subscript & Superscript',
    args: {initial: markup.subAndSub},
};

export const Emojis: Story = {
    args: {initial: markup.emojis},
};

export const DefinitionList: Story = {
    args: {initial: markup.deflist},
};
