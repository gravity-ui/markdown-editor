import type {StoryObj} from '@storybook/react';

import {HeaderDemo as component} from './Header';

type Story = StoryObj<typeof component>;
export const Design: Story = {args: {markupKey: 'design'}};
export const Empty: Story = {args: {markupKey: 'empty'}};
export const DesignSizes: Story = {args: {markupKey: 'designSizes'}};
export const Widths: Story = {args: {markupKey: 'widths'}};
export const DesignLayouts: Story = {args: {markupKey: 'designLayouts'}};
export const Backgrounds: Story = {args: {markupKey: 'backgrounds'}};
export const ImageThemes: Story = {args: {markupKey: 'imageThemes'}};
export const Shapes: Story = {args: {markupKey: 'shapes'}};
export const Fills: Story = {args: {markupKey: 'fills'}};
export const Buttons: Story = {args: {markupKey: 'buttons'}};
export const Content: Story = {args: {markupKey: 'content'}};
export const InsideCut: Story = {args: {markupKey: 'insideCut'}};
export const UnknownValues: Story = {args: {markupKey: 'unknownValues'}};
export const LongContent: Story = {args: {markupKey: 'longContent'}};
export default {title: 'Examples / Header', component};
