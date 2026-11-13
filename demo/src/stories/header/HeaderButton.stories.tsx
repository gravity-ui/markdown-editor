import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from './Header';
import {buttonStylesMarkup} from './markup';

export default {
    title: 'Extensions / Landing / Header blocks / Button',
    component: HeaderExample,
    args: {mode: 'markup', preview: true, width: 720},
} satisfies Meta<typeof HeaderExample>;

/** Every view and color in the text, then the same buttons inside a header. */
export const Button: StoryObj<typeof HeaderExample> = {
    args: {initial: buttonStylesMarkup},
};
