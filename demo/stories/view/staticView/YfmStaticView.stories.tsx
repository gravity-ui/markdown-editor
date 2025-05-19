import transform from '@diplodoc/transform';
import type {StoryObj} from '@storybook/react';

import {YfmStaticView} from 'src/view';

import {markup} from '../../../defaults/content';

export const Story: StoryObj<typeof YfmStaticView> = {
    args: {
        html: transform(markup).result.html,
    },
};
Story.storyName = 'Static view';

export default {
    title: 'View / YfmStaticView',
    component: YfmStaticView,
};
