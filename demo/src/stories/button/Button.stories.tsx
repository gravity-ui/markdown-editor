import type {Meta, StoryObj} from '@storybook/react';

import {HeaderExample} from '../header/Header';
import {buttonRowsMarkup, buttonStylesMarkup} from '../header/markup';

export default {
    title: 'Extensions / Landing / Button',
    component: HeaderExample,
    args: {
        initial: ':button[Кнопка]{href="https://example.com" view="action" color="standard"}',
        width: 660,
    },
} satisfies Meta<typeof HeaderExample>;

export const Button: StoryObj<typeof HeaderExample> = {};

/** Every view and color, a row of buttons per color. */
export const Colors: StoryObj<typeof HeaderExample> = {
    args: {initial: buttonRowsMarkup()},
};

/** Every view and color in the text, then the same buttons inside headers. */
export const Preview: StoryObj<typeof HeaderExample> = {
    args: {mode: 'markup', preview: true, width: 720, initial: buttonStylesMarkup},
};
