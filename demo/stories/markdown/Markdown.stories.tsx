import type {StoryObj} from '@storybook/react';

import {PlaygroundMini as component} from '../../components/PlaygroundMini';
import {args} from '../../defaults/args';
import {excludedControls} from '../../defaults/excluded-controls';

import {markup} from './markup';

export const Heading: StoryObj<typeof component> = {
    args: {initial: markup.heading},
};

export const Blockquote: StoryObj<typeof component> = {
    args: {initial: markup.blockquote},
};

export const Emphasis: StoryObj<typeof component> = {
    args: {initial: markup.emphasis},
};

export const HorizontalRules: StoryObj<typeof component> = {
    args: {initial: markup.horizontalRules},
};

export const Lists: StoryObj<typeof component> = {
    args: {initial: markup.lists},
};

export const Code: StoryObj<typeof component> = {
    args: {initial: markup.code},
};

export const Tables: StoryObj<typeof component> = {
    args: {initial: markup.tables},
};

export const Links: StoryObj<typeof component> = {
    args: {initial: markup.links},
};

export const Images: StoryObj<typeof component> = {
    args: {initial: markup.images},
};

export const SubSup: StoryObj<typeof component> = {
    name: 'Subscript & Superscript',
    args: {initial: markup.subAndSub},
};

export const Emojis: StoryObj<typeof component> = {
    args: {initial: markup.emojis},
};

export const DefinitionList: StoryObj<typeof component> = {
    args: {initial: markup.deflist},
};

export default {
    title: 'Extensions / Markdown',
    component,
    args: args,
    parameters: {
        controls: {
            exclude: excludedControls,
        },
    },
};
