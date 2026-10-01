import type {StoryObj} from '@storybook/react';

import {HeaderDemo as component} from './Header';

type Story = StoryObj<typeof component>;

export const Backgrounds: Story = {args: {markupKey: 'backgrounds'}};
Backgrounds.storyName = 'Backgrounds';

export const Formats: Story = {args: {markupKey: 'formats'}};
Formats.storyName = 'Formats';

export const Angles: Story = {args: {markupKey: 'angles'}};
Angles.storyName = 'Gradient direction and pattern size';

export const Layers: Story = {args: {markupKey: 'layers'}};
Layers.storyName = 'Image layers';

export const Crops: Story = {args: {markupKey: 'crops'}};
Crops.storyName = 'Image fit and focus';

export const Fills: Story = {args: {markupKey: 'fills'}};
Fills.storyName = 'Fills';

export const Seeds: Story = {args: {markupKey: 'seeds'}};
Seeds.storyName = 'Shape layouts';

export const Content: Story = {args: {markupKey: 'content'}};
Content.storyName = 'Title, actions and subtitle';

export const InsideCut: Story = {args: {markupKey: 'insideCut'}};
InsideCut.storyName = 'Inside cut';

export const UnknownValues: Story = {args: {markupKey: 'unknownValues'}};
UnknownValues.storyName = 'Unknown attribute values';

export const Empty: Story = {args: {markupKey: 'empty'}};
Empty.storyName = 'Empty';

export default {
    title: 'Examples / Header',
    component,
};
