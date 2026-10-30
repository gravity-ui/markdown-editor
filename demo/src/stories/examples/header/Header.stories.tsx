import type {Meta, StoryObj} from '@storybook/react';

import {HeaderCatalogue, HeaderEditor} from './Header';

type Story = StoryObj<typeof HeaderCatalogue>;

const group = (name: string): Story => ({name, args: {group: name}});

export const Alignment = group('Alignment');
export const Height = group('Height');
export const Width = group('Width');
export const Border = group('Border');
export const Fill = group('Fill');
export const BackgroundImage = group('Background image');
export const DecorLayer = group('Decor layer');
export const TextColor = group('Text color');
export const ContentImage = group('Content image');
export const Title = group('Title');
export const Content = group('Content');
export const Actions = group('Actions');
export const Combinations = group('Combinations');
export const EdgeCases = group('Edge cases');

/** Все группы подряд. */
export const Catalogue: Story = {};

export const Editor: StoryObj = {render: () => <HeaderEditor />};

const meta: Meta<typeof HeaderCatalogue> = {
    title: 'Examples / Header',
    component: HeaderCatalogue,
};
export default meta;
