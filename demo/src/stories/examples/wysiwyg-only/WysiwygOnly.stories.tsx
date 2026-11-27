import type {StoryObj} from '@storybook/react';

import {WysiwygBroken} from './WysiwygBroken';
import {WysiwygOnly as component} from './WysiwygOnly';

export const Default: StoryObj<typeof component> = {};

export const Mobile: StoryObj<typeof component> = {
    args: {mobile: true},
};

export const Broken: StoryObj<typeof WysiwygBroken> = {
    globals: {lang: 'ru'},
    render: () => <WysiwygBroken />,
};

export default {
    title: 'Examples / WYSIWYG only',
    component,
};
