import type {StoryObj} from '@storybook/react';

import {ImgResolveSrcDemo as component} from './ImgResolveSrc';

export const Story: StoryObj<typeof component> = {
    args: {},
};
Story.storyName = 'Resolve Image Src';

export default {
    title: 'Examples / Resolve Image Src',
    component,
};
