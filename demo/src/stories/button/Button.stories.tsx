import type {Meta, StoryObj} from '@storybook/react';

import {buttonStyleRows, buttonStylesMarkup} from '../header/markup';

import {ButtonExample} from './Button';

export default {
    title: 'Extensions / Landing / Button',
    component: ButtonExample,
} satisfies Meta<typeof ButtonExample>;

export const Button: StoryObj<typeof ButtonExample> = {};

export const Colors: StoryObj<typeof ButtonExample> = {
    name: 'States',
    args: {
        initial: buttonStyleRows
            .map((row) =>
                row
                    .map(([view, color]) => `:button[Кнопка]{view="${view}" color="${color}"}`)
                    .join(' '),
            )
            .join('\n\n'),
    },
};

/** Every view and color in the text, then the same buttons inside headers. */
export const Preview: StoryObj<typeof ButtonExample> = {
    args: {mode: 'markup', preview: true, width: 720, initial: buttonStylesMarkup},
};
