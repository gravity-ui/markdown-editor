import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';

export default {title: 'Extensions/Header', component: HeaderExample} satisfies Meta<
    typeof HeaderExample
>;
export const Wysiwyg: StoryObj<typeof HeaderExample> = {};
export const Markdown: StoryObj<typeof HeaderExample> = {args: {mode: 'markup'}};
