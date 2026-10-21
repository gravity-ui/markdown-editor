import type {Meta, StoryObj} from '@storybook/react';

import {HeaderDemo as component} from './Header';
import {markup} from './markup';

const meta: Meta<typeof component> = {
    title: 'Examples / Header',
    component,
    args: {uploadEnabled: true},
};

export default meta;

type Story = StoryObj<typeof component>;

export const Empty: Story = {
    name: 'Empty — placeholders',
    args: {markup: markup.empty},
};

export const Filled: Story = {
    name: 'Title, description and two actions',
    args: {markup: markup.filled},
};

export const Compact: Story = {
    name: 'Compact format',
    args: {markup: markup.small},
};

export const Bleed: Story = {
    name: 'Bleed edges',
    args: {markup: markup.bleed},
};

export const Fills: Story = {
    name: 'Every fill in the palette',
    args: {markup: markup.fills},
};

export const Decor: Story = {
    name: 'Fill pattern on and off',
    args: {markup: markup.decor},
};

export const Borders: Story = {
    name: 'Border styles',
    args: {markup: markup.borders},
};

export const BackgroundImage: Story = {
    name: 'Background image',
    args: {markup: markup.image},
};

export const BackgroundImageLightText: Story = {
    name: 'Background image, light text',
    args: {markup: markup.imageDark},
};

export const ImageBesideText: Story = {
    name: 'Image beside the text',
    args: {markup: markup.imageSplit},
};

export const EmptyImageSlot: Story = {
    name: 'Image slot, nothing uploaded yet',
    args: {markup: markup.imageEmpty},
};

export const WithoutUploadHandler: Story = {
    name: 'Host without an upload handler',
    args: {markup: markup.image, uploadEnabled: false},
};

export const InsideCut: Story = {
    name: 'Inside a cut',
    args: {markup: markup.nested},
};

export const EveryAttribute: Story = {
    name: 'Every attribute at once',
    args: {markup: markup.everything},
};

export const MalformedDirective: Story = {
    name: 'Malformed directive in the body',
    args: {markup: markup.broken},
};
