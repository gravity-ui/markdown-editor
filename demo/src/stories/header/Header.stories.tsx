import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';
import {headerPreviewMarkup} from './markup';

export default {
    title: 'Extensions / Landing / Header',
    component: HeaderExample,
} satisfies Meta<typeof HeaderExample>;
export const Header: StoryObj<typeof HeaderExample> = {};

/** Every size, alignment and background of the header with the content of the mock. */
export const Preview: StoryObj<typeof HeaderExample> = {
    args: {mode: 'markup', preview: true, width: 1000, initial: headerPreviewMarkup},
};
