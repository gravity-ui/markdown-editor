import type {Meta, StoryObj} from '@storybook/react';

import {HeaderSyntax} from './HeaderSyntax';

export default {
    title: 'Extensions / Landing / Header syntax',
    component: HeaderSyntax,
} satisfies Meta<typeof HeaderSyntax>;

/** Every example of the syntax, section by section: the Markdown source next to its preview. */
export const AllCases: StoryObj<typeof HeaderSyntax> = {
    name: 'All cases',
};
